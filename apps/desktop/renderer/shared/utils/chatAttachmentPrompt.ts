import type { ChatAttachment, ChatMessage, ChatPromptInput } from '@/shared/types/chat';
import { readMessagePartState } from '@/shared/utils/chatMessageParts';

const DEFAULT_ATTACHMENT_NAME = 'file';
const DEFAULT_ATTACHMENT_MIME_TYPE = 'text/plain';

export const normalizeAttachmentName = (name: string): string => {
  const trimmed = name.trim();
  return trimmed || DEFAULT_ATTACHMENT_NAME;
};

const sanitizePromptAttribute = (value: string): string => value.replace(/"/g, "'");

const getPromptAttachments = (attachments?: ChatAttachment[]): ChatAttachment[] => {
  return Array.isArray(attachments)
    ? attachments.filter(
        (attachment) =>
          attachment.kind === 'image' ||
          attachment.textContent.length > 0 ||
          attachment.name.length > 0
      )
    : [];
};

const buildAttachmentPromptBlock = (attachment: ChatAttachment, index: number): string => {
  if (attachment.kind === 'image' && attachment.data) {
    return [
      `<attached-image index="${index + 1}" id="${sanitizePromptAttribute(
        attachment.id
      )}" name="${sanitizePromptAttribute(attachment.name)}" mime="${sanitizePromptAttribute(
        attachment.mimeType || DEFAULT_ATTACHMENT_MIME_TYPE
      )}">`,
      `Use the analyze_uploaded_image tool with attachment_id="${sanitizePromptAttribute(
        attachment.id
      )}" to inspect this image before answering questions about its visual content.`,
      '</attached-image>',
    ].join('\n');
  }

  return [
    `<attached-file index="${index + 1}" name="${sanitizePromptAttribute(
      attachment.name
    )}" mime="${sanitizePromptAttribute(attachment.mimeType || DEFAULT_ATTACHMENT_MIME_TYPE)}" truncated="${
      attachment.truncated ? 'true' : 'false'
    }">`,
    attachment.textContent,
    '</attached-file>',
  ].join('\n');
};

export const buildAttachmentPromptSection = (attachments?: ChatAttachment[]): string => {
  const promptAttachments = getPromptAttachments(attachments);
  if (promptAttachments.length === 0) {
    return '';
  }

  return ['Attached files:', '', ...promptAttachments.map(buildAttachmentPromptBlock)].join('\n\n');
};

export const buildMessagePromptContent = (message: ChatPromptInput | ChatMessage): string => {
  const partState = 'parts' in message ? readMessagePartState(message) : null;
  const messageText = partState ? partState.text : (message as ChatPromptInput).text;
  const normalizedText = messageText.trim().length > 0 ? messageText : '';
  const attachments = partState
    ? partState.attachments
    : (message as ChatPromptInput).attachments;
  const attachmentSection = buildAttachmentPromptSection(attachments);

  if (normalizedText && attachmentSection) {
    return `${normalizedText}\n\n${attachmentSection}`;
  }

  return normalizedText || attachmentSection;
};

export const DEFAULT_CHAT_ATTACHMENT_MIME_TYPE = DEFAULT_ATTACHMENT_MIME_TYPE;
