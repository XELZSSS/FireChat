const {
  createDocumentAttachmentParserError,
  ensureTextWasExtracted,
  getFileExtension,
  isDocumentAttachmentParserError,
  resolveAttachmentMimeType,
  toBuffer,
  wrapDocumentAttachmentParserError,
} = require('./documentAttachmentParsers/shared.cjs');
const { parsePdfBuffer } = require('./documentAttachmentParsers/pdf.cjs');
const { parseWordBuffer } = require('./documentAttachmentParsers/word.cjs');
const { parseSpreadsheetBuffer } = require('./documentAttachmentParsers/spreadsheet.cjs');
const { parsePresentationBuffer } = require('./documentAttachmentParsers/presentation.cjs');
const { parseOfficeBuffer } = require('./documentAttachmentParsers/officeParser.cjs');

const ATTACHMENT_PARSE_TIMEOUT_MS = 20_000;

const PARSERS_BY_EXTENSION = {
  pdf: parsePdfBuffer,
  docx: parseWordBuffer,
  xlsx: (buffer) => parseSpreadsheetBuffer(buffer, 'xlsx'),
  xlsm: (buffer) => parseSpreadsheetBuffer(buffer, 'xlsx'),
  pptx: parsePresentationBuffer,
  ppt: parseOfficeBuffer,
  rtf: parseOfficeBuffer,
  odt: parseOfficeBuffer,
  odp: parseOfficeBuffer,
  ods: (buffer) => parseSpreadsheetBuffer(buffer, 'ods'),
};

const runWithParseTimeout = async (extension, promise) => {
  let timeoutId = null;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            createDocumentAttachmentParserError(
              'parse_timeout',
              `Timed out while parsing ${extension || 'attachment'}`
            )
          );
        }, ATTACHMENT_PARSE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const parseAttachmentBuffer = async ({ fileName, mimeType, bytes, pageRange }) => {
  const extension = getFileExtension(fileName);
  const parseAttachment = PARSERS_BY_EXTENSION[extension];

  if (!parseAttachment) {
    throw createDocumentAttachmentParserError(
      'unsupported_extension',
      `Unsupported attachment extension: ${extension || 'unknown'}`
    );
  }

  const buffer = toBuffer(bytes);

  try {
    const textContent = await runWithParseTimeout(extension, parseAttachment(buffer, pageRange));
    return {
      mimeType: resolveAttachmentMimeType(extension, mimeType),
      textContent: ensureTextWasExtracted(textContent),
    };
  } catch (error) {
    if (isDocumentAttachmentParserError(error)) {
      throw error;
    }

    throw wrapDocumentAttachmentParserError(
      'parser_failed',
      error,
      `Failed to parse ${extension || 'attachment'}`
    );
  }
};

module.exports = {
  parseAttachmentBuffer,
};
