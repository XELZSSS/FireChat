import type { ChatAttachment } from '@/shared/types/chat';
import {
  ChatAttachmentReadError,
  getChatAttachmentUploadRejectionCode,
  MAX_CHAT_ATTACHMENTS_PER_MESSAGE,
  readTextAttachmentFromFile,
  type StructuredAttachmentParseOptions,
} from '@/shared/utils/chatAttachments';
import { parseDesktopAttachment } from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import { t } from '@/shared/utils/i18n';

const DEFAULT_FILE_NAME = 'file';
const ATTACHMENT_ERROR_MESSAGE_KEYS = {
  image: 'input.attach.imageUnsupported',
  too_large: 'input.attach.fileTooLarge',
  binary: 'input.attach.binaryUnsupported',
  read_failed: 'input.attach.readFailed',
  unsupported_extension: 'input.attach.unsupportedExtension',
  empty_content: 'input.attach.emptyContent',
  parse_timeout: 'input.attach.parseTimeout',
  page_range_invalid: 'input.attach.pageRangeInvalid',
  parser_failed: 'input.attach.parseFailed',
  parser_unavailable: 'input.attach.parserUnavailable',
} as const;

export type PendingStructuredAttachment = {
  id: string;
  file: File;
  pageRange: string;
  supportsPageRange: boolean;
};

const getAttachmentErrorMessage = (fileName: string, error: unknown): string => {
  if (error instanceof ChatAttachmentReadError) {
    return `${fileName}: ${t(ATTACHMENT_ERROR_MESSAGE_KEYS[error.code])}`;
  }

  return `${fileName}: ${t(ATTACHMENT_ERROR_MESSAGE_KEYS.read_failed)}`;
};

const getSafeFileName = (name: string | undefined): string => name || DEFAULT_FILE_NAME;

const toAttachmentNotice = (messages: string[]): string | null =>
  messages.length > 0 ? messages.join(' ') : null;

const createPendingStructuredAttachmentId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `pending-attachment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getStructuredParserOptions = (file: File): { supportsPageRange: boolean } => {
  const extension = file.name.split('.').pop()?.trim().toLowerCase() ?? '';

  if (extension === 'pdf' || extension === 'pptx') {
    return { supportsPageRange: true };
  }

  return { supportsPageRange: false };
};

export const createPendingStructuredAttachment = (file: File): PendingStructuredAttachment => ({
  id: createPendingStructuredAttachmentId(),
  file,
  pageRange: '',
  supportsPageRange: getStructuredParserOptions(file).supportsPageRange,
});

export const combineAttachmentNotices = (...notices: Array<string | null>): string | null =>
  toAttachmentNotice(notices.filter((notice): notice is string => Boolean(notice)));

export const partitionAttachmentFilesByUploadSupport = (
  selectedFiles: File[]
): { acceptedFiles: File[]; rejectedMessages: string[] } => {
  const acceptedFiles: File[] = [];
  const rejectedMessages: string[] = [];

  for (const file of selectedFiles) {
    const rejectionCode = getChatAttachmentUploadRejectionCode(file);

    if (rejectionCode) {
      rejectedMessages.push(
        getAttachmentErrorMessage(
          getSafeFileName(file.name),
          new ChatAttachmentReadError(rejectionCode)
        )
      );
      continue;
    }

    acceptedFiles.push(file);
  }

  return { acceptedFiles, rejectedMessages };
};

export const buildAttachmentSelectionResult = async ({
  existingAttachments,
  selectedFiles,
  version,
  isSelectionCurrent,
  resolveStructuredDocumentOptions,
}: {
  existingAttachments: ChatAttachment[];
  selectedFiles: File[];
  version: number;
  isSelectionCurrent: (version: number) => boolean;
  resolveStructuredDocumentOptions?: (file: File) => StructuredAttachmentParseOptions | undefined;
}): Promise<{ attachments: ChatAttachment[]; notice: string | null } | null> => {
  const nextAttachments = [...existingAttachments];
  const nextNotices: string[] = [];

  if (selectedFiles.length + existingAttachments.length > MAX_CHAT_ATTACHMENTS_PER_MESSAGE) {
    nextNotices.push(t('input.attach.tooMany'));
  }

  for (const file of selectedFiles) {
    if (nextAttachments.length >= MAX_CHAT_ATTACHMENTS_PER_MESSAGE) {
      break;
    }

    try {
      const attachment = await readTextAttachmentFromFile(file, {
        parseStructuredDocument: parseDesktopAttachment,
        structuredDocumentOptions: resolveStructuredDocumentOptions?.(file),
      });

      if (!isSelectionCurrent(version)) {
        return null;
      }

      nextAttachments.push(attachment);
    } catch (error) {
      if (!isSelectionCurrent(version)) {
        return null;
      }

      nextNotices.push(getAttachmentErrorMessage(getSafeFileName(file.name), error));
    }
  }

  if (!isSelectionCurrent(version)) {
    return null;
  }

  return {
    attachments: nextAttachments,
    notice: toAttachmentNotice(nextNotices),
  };
};
