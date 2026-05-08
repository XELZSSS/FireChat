const path = require('path');

const PAGE_RANGE_SPLITTER_RE = /[,，]+/;
const PARSER_ERROR_PREFIX = 'ATTACHMENT_PARSE_ERROR:';

const MIME_BY_EXTENSION = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rtf: 'application/rtf',
  xlsm: 'application/vnd.ms-excel.sheet.macroenabled.12',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  odt: 'application/vnd.oasis.opendocument.text',
  odp: 'application/vnd.oasis.opendocument.presentation',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
};

const formatDocumentAttachmentParserErrorMessage = (code, message) => {
  const normalizedMessage = String(message ?? '').trim();
  return normalizedMessage
    ? `${PARSER_ERROR_PREFIX}${code}:${normalizedMessage}`
    : `${PARSER_ERROR_PREFIX}${code}`;
};

const createDocumentAttachmentParserError = (code, message) => {
  const error = new Error(formatDocumentAttachmentParserErrorMessage(code, message));
  error.name = 'DocumentAttachmentParserError';
  error.code = code;
  return error;
};

const getDocumentAttachmentParserErrorCode = (error) => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  if (typeof error.code === 'string' && error.code.trim()) {
    return error.code.trim();
  }

  const message = typeof error.message === 'string' ? error.message : '';
  if (!message.startsWith(PARSER_ERROR_PREFIX)) {
    return null;
  }

  const suffix = message.slice(PARSER_ERROR_PREFIX.length);
  return suffix.split(':', 1)[0] || null;
};

const isDocumentAttachmentParserError = (error) => {
  return Boolean(getDocumentAttachmentParserErrorCode(error));
};

const wrapDocumentAttachmentParserError = (code, error, defaultMessage) => {
  if (isDocumentAttachmentParserError(error)) {
    return error;
  }

  const message =
    typeof error?.message === 'string' && error.message.trim()
      ? error.message.trim()
      : defaultMessage;
  return createDocumentAttachmentParserError(code, message);
};

const getFileExtension = (fileName) => {
  return path
    .extname(String(fileName ?? ''))
    .replace(/^\./, '')
    .trim()
    .toLowerCase();
};

const toBuffer = (value) => {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }

  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }

  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }

  if (Array.isArray(value)) {
    return Buffer.from(value);
  }

  throw createDocumentAttachmentParserError('parser_failed', 'Invalid attachment bytes');
};

const stripControlCharacters = (value, { keepNewlines = false } = {}) => {
  return Array.from(String(value ?? ''))
    .filter((character) => {
      const code = character.charCodeAt(0);
      if (code >= 32 || code === 9) {
        return true;
      }

      if (keepNewlines && (code === 10 || code === 13)) {
        return true;
      }

      return false;
    })
    .join('');
};

const normalizeExtractedText = (value) => {
  return stripControlCharacters(value, { keepNewlines: true })
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const parsePageRange = (value, upperBound) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return null;
  }

  const indexes = new Set();
  let hasSegment = false;

  for (const segment of normalized.split(PAGE_RANGE_SPLITTER_RE)) {
    const part = segment.trim();
    if (!part) {
      continue;
    }

    hasSegment = true;
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number.parseInt(rangeMatch[1], 10);
      const end = Number.parseInt(rangeMatch[2], 10);
      const min = Math.max(1, Math.min(start, end));
      const max = Math.min(upperBound, Math.max(start, end));
      if (min <= max) {
        for (let pageNumber = min; pageNumber <= max; pageNumber += 1) {
          indexes.add(pageNumber - 1);
        }
      }
      continue;
    }

    const pageNumber = Number.parseInt(part, 10);
    if (Number.isFinite(pageNumber) && pageNumber >= 1 && pageNumber <= upperBound) {
      indexes.add(pageNumber - 1);
    }
  }

  if (!hasSegment || indexes.size === 0) {
    throw createDocumentAttachmentParserError('page_range_invalid', 'Invalid page range');
  }

  return [...indexes].sort((left, right) => left - right);
};

const selectIndexedSegments = (segments, pageRange) => {
  const normalizedRange = String(pageRange ?? '').trim();
  if (!normalizedRange) {
    return segments;
  }

  const indexes = parsePageRange(normalizedRange, segments.length);
  return indexes.map((index) => segments[index]).filter(Boolean);
};

const decodeXmlEntities = (value) => {
  return String(value ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));
};

const rowsToMarkdown = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '';
  }

  const normalizeCell = (cell) => (cell == null ? '' : String(cell).trim());
  const head = rows[0].map(normalizeCell);
  const body = rows.slice(1).map((row) => row.map(normalizeCell));
  const headerLine = `| ${head.join(' | ')} |`;
  const separatorLine = `| ${head.map(() => '---').join(' | ')} |`;
  const bodyLines = body.map((row) => `| ${row.join(' | ')} |`);
  return [headerLine, separatorLine, ...bodyLines].join('\n');
};

const resolveAttachmentMimeType = (extension, providedMimeType) => {
  const normalizedMimeType = String(providedMimeType ?? '').trim();
  return normalizedMimeType || MIME_BY_EXTENSION[extension] || 'text/plain';
};

const ensureTextWasExtracted = (textContent) => {
  if (!textContent) {
    throw createDocumentAttachmentParserError(
      'empty_content',
      'No extractable text content found in attachment'
    );
  }

  return textContent;
};

module.exports = {
  createDocumentAttachmentParserError,
  decodeXmlEntities,
  ensureTextWasExtracted,
  formatDocumentAttachmentParserErrorMessage,
  getDocumentAttachmentParserErrorCode,
  getFileExtension,
  isDocumentAttachmentParserError,
  normalizeExtractedText,
  resolveAttachmentMimeType,
  rowsToMarkdown,
  selectIndexedSegments,
  toBuffer,
  wrapDocumentAttachmentParserError,
};
