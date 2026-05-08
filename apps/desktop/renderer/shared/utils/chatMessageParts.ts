import type {
  ChatAttachment,
  ChatGeneratedImage,
  ChatMessage,
  ChatMessagePart,
  ChatToolCall,
  ChatToolResult,
  Citation,
} from '@/shared/types/chat';

const TEXT_PART_ID = 'text';
const REASONING_PART_ID = 'reasoning';

const buildPartId = (messageId: string, suffix: string) => `${messageId}:${suffix}`;

const getPartsByType = <TType extends ChatMessagePart['type']>(
  message: ChatMessage,
  type: TType
): Array<Extract<ChatMessagePart, { type: TType }>> => {
  return message.parts.filter(
    (part): part is Extract<ChatMessagePart, { type: TType }> => part.type === type
  );
};

export const getMessageText = (message: ChatMessage): string => {
  return getPartsByType(message, 'text')
    .map((part) => part.text)
    .join('');
};

export const getMessageReasoning = (message: ChatMessage): string => {
  return getPartsByType(message, 'reasoning')
    .map((part) => part.text)
    .join('');
};

export const getMessageReasoningStatus = (
  message: ChatMessage
): 'streaming' | 'completed' | undefined => {
  return getPartsByType(message, 'reasoning')[0]?.status;
};

export const getMessageAttachments = (message: ChatMessage): ChatAttachment[] => {
  return getPartsByType(message, 'attachment').map((part) => part.attachment);
};

export const getMessageGeneratedImages = (message: ChatMessage): ChatGeneratedImage[] => {
  return getPartsByType(message, 'generated-image').map((part) => part.image);
};

export const getMessageToolCalls = (message: ChatMessage): ChatToolCall[] => {
  return getPartsByType(message, 'tool-call').map((part) => part.call);
};

export const getMessageToolResults = (message: ChatMessage): ChatToolResult[] => {
  return getPartsByType(message, 'tool-result').map((part) => part.result);
};

export const getMessageCitations = (message: ChatMessage): Citation[] => {
  return getPartsByType(message, 'citation').map((part) => part.citation);
};

export const buildMessageParts = ({
  messageId,
  text,
  attachments,
  generatedImages,
  reasoning,
  reasoningStatus,
  toolCalls,
  toolResults,
  citations,
}: {
  messageId: string;
  text?: string;
  attachments?: ChatAttachment[];
  generatedImages?: ChatGeneratedImage[];
  reasoning?: string;
  reasoningStatus?: 'streaming' | 'completed';
  toolCalls?: ChatToolCall[];
  toolResults?: ChatToolResult[];
  citations?: Citation[];
}): ChatMessagePart[] => {
  const parts: ChatMessagePart[] = [];

  for (const attachment of attachments ?? []) {
    parts.push({
      id: buildPartId(messageId, `attachment:${attachment.id}`),
      type: 'attachment',
      attachment,
    });
  }

  for (const image of generatedImages ?? []) {
    parts.push({
      id: buildPartId(messageId, `generated-image:${image.id}`),
      type: 'generated-image',
      image,
    });
  }

  if (text && text.length > 0) {
    parts.push({
      id: buildPartId(messageId, TEXT_PART_ID),
      type: 'text',
      text,
    });
  }

  if (reasoning && reasoning.length > 0 && reasoningStatus) {
    parts.push({
      id: buildPartId(messageId, REASONING_PART_ID),
      type: 'reasoning',
      text: reasoning,
      status: reasoningStatus,
    });
  }

  for (const call of toolCalls ?? []) {
    parts.push({
      id: buildPartId(messageId, `tool-call:${call.id}`),
      type: 'tool-call',
      call,
    });
  }

  for (const result of toolResults ?? []) {
    parts.push({
      id: buildPartId(messageId, `tool-result:${result.id}`),
      type: 'tool-result',
      result,
    });
  }

  (citations ?? []).forEach((citation, index) => {
    const citationId =
      citation.chunkId ?? citation.documentId ?? citation.url ?? `${citation.sourceKind}:${index}`;
    parts.push({
      id: buildPartId(messageId, `citation:${citationId}`),
      type: 'citation',
      citation,
    });
  });

  return parts;
};

export const readMessagePartState = (message: ChatMessage) => {
  const state = {
    text: '',
    attachments: [] as ChatAttachment[],
    generatedImages: [] as ChatGeneratedImage[],
    reasoning: '',
    reasoningStatus: undefined as 'streaming' | 'completed' | undefined,
    toolCalls: [] as ChatToolCall[],
    toolResults: [] as ChatToolResult[],
    citations: [] as Citation[],
  };

  for (const part of message.parts) {
    if (part.type === 'text') {
      state.text += part.text;
    } else if (part.type === 'reasoning') {
      state.reasoning += part.text;
      state.reasoningStatus ??= part.status;
    } else if (part.type === 'attachment') {
      state.attachments.push(part.attachment);
    } else if (part.type === 'generated-image') {
      state.generatedImages.push(part.image);
    } else if (part.type === 'tool-call') {
      state.toolCalls.push(part.call);
    } else if (part.type === 'tool-result') {
      state.toolResults.push(part.result);
    } else if (part.type === 'citation') {
      state.citations.push(part.citation);
    }
  }

  return state;
};
