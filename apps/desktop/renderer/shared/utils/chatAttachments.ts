import type { ChatAttachment } from '@/shared/types/chat';
import {
  ChatAttachmentReadError,
  type ChatAttachmentReadErrorCode,
} from '@/shared/utils/chatAttachmentErrors';
import { decodeTextFile, hasBinaryLikeContent } from '@/shared/utils/chatAttachmentTextDecoding';
import {
  getChatAttachmentUploadRejectionCode,
  CHAT_ATTACHMENT_FILE_ACCEPT,
  isImageFileLike,
  isStructuredDocumentFileLike,
  isTextLikeFile,
  MAX_CHAT_ATTACHMENT_TEXT_LENGTH,
} from '@/shared/utils/chatAttachmentFileRules';
import {
  DEFAULT_CHAT_ATTACHMENT_MIME_TYPE,
  normalizeAttachmentName,
} from '@/shared/utils/chatAttachmentPrompt';

export { ChatAttachmentReadError } from '@/shared/utils/chatAttachmentErrors';
export type { ChatAttachmentReadErrorCode } from '@/shared/utils/chatAttachmentErrors';
export {
  CHAT_ATTACHMENT_FILE_ACCEPT,
  getChatAttachmentUploadRejectionCode,
  isImageFileLike,
  isStructuredDocumentFileLike,
  MAX_CHAT_ATTACHMENTS_PER_MESSAGE,
  MAX_CHAT_ATTACHMENT_SIZE_BYTES,
  MAX_CHAT_ATTACHMENT_TEXT_LENGTH,
} from '@/shared/utils/chatAttachmentFileRules';
export { buildMessagePromptContent } from '@/shared/utils/chatAttachmentPrompt';

type StructuredAttachmentParser = (payload: {
  fileName: string;
  mimeType?: string;
  bytes: Uint8Array | ArrayBuffer;
  pageRange?: string;
}) => Promise<{
  mimeType: string;
  textContent: string;
}>;

export type StructuredAttachmentParseOptions = {
  pageRange?: string;
};

const KILOBYTE = 1024;
const MEGABYTE = 1024 * 1024;
const DOCUMENT_ATTACHMENT_PARSER_ERROR_PREFIX = 'ATTACHMENT_PARSE_ERROR:';
const STRUCTURED_ATTACHMENT_ERROR_CODES = new Set<ChatAttachmentReadErrorCode>([
  'unsupported_extension',
  'empty_content',
  'parse_timeout',
  'page_range_invalid',
  'parser_failed',
]);

const createAttachmentId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `attachment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const formatAttachmentSize = (size: number): string => {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B';
  }

  if (size < KILOBYTE) {
    return `${Math.round(size)} B`;
  }

  if (size < MEGABYTE) {
    return `${(size / KILOBYTE).toFixed(size < 10 * KILOBYTE ? 1 : 0)} KB`;
  }

  return `${(size / MEGABYTE).toFixed(1)} MB`;
};

const readFileBytes = async (file: File): Promise<Uint8Array> => {
  try {
    return new Uint8Array(await file.arrayBuffer());
  } catch {
    throw new ChatAttachmentReadError('read_failed');
  }
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

const resolveStructuredAttachmentErrorCode = (
  error: unknown
): ChatAttachmentReadErrorCode | null => {
  if (error instanceof ChatAttachmentReadError) {
    return error.code;
  }

  const errorCode =
    error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : null;
  if (
    errorCode &&
    STRUCTURED_ATTACHMENT_ERROR_CODES.has(errorCode as ChatAttachmentReadErrorCode)
  ) {
    return errorCode as ChatAttachmentReadErrorCode;
  }

  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (!message.startsWith(DOCUMENT_ATTACHMENT_PARSER_ERROR_PREFIX)) {
    return null;
  }

  const code = message.slice(DOCUMENT_ATTACHMENT_PARSER_ERROR_PREFIX.length).split(':', 1)[0];
  return STRUCTURED_ATTACHMENT_ERROR_CODES.has(code as ChatAttachmentReadErrorCode)
    ? (code as ChatAttachmentReadErrorCode)
    : null;
};

const parseStructuredDocumentAttachment = async (
  file: File,
  bytes: Uint8Array,
  parser?: StructuredAttachmentParser,
  parseOptions?: StructuredAttachmentParseOptions
): Promise<{ textContent: string; mimeType: string }> => {
  if (!parser) {
    throw new ChatAttachmentReadError('parser_unavailable');
  }

  try {
    const parsed = await parser({
      fileName: file.name,
      mimeType: file.type || undefined,
      bytes,
      pageRange: parseOptions?.pageRange,
    });

    return {
      mimeType: parsed.mimeType || file.type || DEFAULT_CHAT_ATTACHMENT_MIME_TYPE,
      textContent: String(parsed.textContent ?? ''),
    };
  } catch (error) {
    const code = resolveStructuredAttachmentErrorCode(error);
    throw new ChatAttachmentReadError(code ?? 'parser_failed');
  }
};

const decodeAttachmentText = (
  bytes: Uint8Array,
  options?: { tryLegacyEncodings?: boolean }
): string => {
  try {
    return decodeTextFile(bytes, options);
  } catch (error) {
    if (error instanceof ChatAttachmentReadError) {
      throw error;
    }
    throw new ChatAttachmentReadError('read_failed');
  }
};

export const readTextAttachmentFromFile = async (
  file: File,
  options?: {
    parseStructuredDocument?: StructuredAttachmentParser;
    structuredDocumentOptions?: StructuredAttachmentParseOptions;
  }
): Promise<ChatAttachment> => {
  const uploadRejectionCode = getChatAttachmentUploadRejectionCode(file);
  if (uploadRejectionCode) {
    throw new ChatAttachmentReadError(uploadRejectionCode);
  }

  const bytes = await readFileBytes(file);
  if (isImageFileLike(file)) {
    return {
      id: createAttachmentId(),
      name: normalizeAttachmentName(file.name),
      mimeType: file.type || 'image/png',
      size: file.size,
      textContent: '',
      kind: 'image',
      data: bytesToBase64(bytes),
    };
  }

  const parsedDocument = isStructuredDocumentFileLike(file)
    ? await parseStructuredDocumentAttachment(
        file,
        bytes,
        options?.parseStructuredDocument,
        options?.structuredDocumentOptions
      )
    : null;
  const decoded =
    parsedDocument?.textContent ??
    decodeAttachmentText(bytes, {
      tryLegacyEncodings: isTextLikeFile(file),
    });

  if (hasBinaryLikeContent(decoded)) {
    throw new ChatAttachmentReadError('binary');
  }

  const isTruncated = decoded.length > MAX_CHAT_ATTACHMENT_TEXT_LENGTH;
  return {
    id: createAttachmentId(),
    name: normalizeAttachmentName(file.name),
    mimeType: parsedDocument?.mimeType || file.type || DEFAULT_CHAT_ATTACHMENT_MIME_TYPE,
    size: file.size,
    textContent: isTruncated ? decoded.slice(0, MAX_CHAT_ATTACHMENT_TEXT_LENGTH) : decoded,
    truncated: isTruncated || undefined,
  };
};
