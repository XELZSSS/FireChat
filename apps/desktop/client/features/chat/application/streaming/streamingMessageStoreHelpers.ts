import { formatMessageTime } from '@/shared/utils/time';
import { ChatMessage, Role } from '@/shared/types/chat';
import { buildMessageParts, readMessagePartState } from '@/shared/utils/chatMessageParts';
import {
  hasMeaningfulMessageChange,
  type MessageOverrides,
} from '@client/features/chat/application/streaming/streamingMessageHelpers';

type MessagePartStateOverrides = {
  text?: string;
  attachments?: ReturnType<typeof readMessagePartState>['attachments'];
  generatedImages?: ReturnType<typeof readMessagePartState>['generatedImages'];
  reasoning?: string;
  reasoningStatus?: ReturnType<typeof readMessagePartState>['reasoningStatus'];
  toolCalls?: ReturnType<typeof readMessagePartState>['toolCalls'];
  toolResults?: ReturnType<typeof readMessagePartState>['toolResults'];
  citations?: ReturnType<typeof readMessagePartState>['citations'];
};

export const buildStreamingChatMessage = (
  role: Role,
  text: string,
  messageId: string,
  overrides: MessageOverrides = {}
): ChatMessage => {
  const {
    timestamp,
    timeLabel,
    attachments,
    generatedImages,
    reasoning,
    reasoningStatus,
    toolCalls,
    toolResults,
    citations,
    ...rest
  } = overrides;
  const resolvedTimestamp = timestamp ?? Date.now();

  return {
    id: messageId,
    role,
    parts: buildMessageParts({
      messageId,
      text,
      attachments,
      generatedImages,
      reasoning,
      reasoningStatus,
      toolCalls,
      toolResults,
      citations,
    }),
    timestamp: resolvedTimestamp,
    timeLabel: timeLabel ?? formatMessageTime(resolvedTimestamp),
    ...rest,
  };
};

export const applyStreamingMessageUpdates = (
  current: ChatMessage,
  messageId: string,
  updates: MessageOverrides
): ChatMessage => {
  const currentPartState = readMessagePartState(current);
  const {
    text,
    attachments,
    generatedImages,
    reasoning,
    reasoningStatus,
    toolCalls,
    toolResults,
    citations,
    ...messageUpdates
  } = updates as MessageOverrides & MessagePartStateOverrides;

  return {
    ...current,
    ...messageUpdates,
    parts: buildMessageParts({
      messageId,
      text: text ?? currentPartState.text,
      attachments: attachments ?? currentPartState.attachments,
      generatedImages: generatedImages ?? currentPartState.generatedImages,
      reasoning: reasoning ?? currentPartState.reasoning,
      reasoningStatus: reasoningStatus ?? currentPartState.reasoningStatus,
      toolCalls: toolCalls ?? currentPartState.toolCalls,
      toolResults: toolResults ?? currentPartState.toolResults,
      citations: citations ?? currentPartState.citations,
    }),
  };
};

export const replaceMessageWhenChanged = (
  messages: ChatMessage[],
  index: number,
  nextMessage: ChatMessage
): ChatMessage[] => {
  if (!hasMeaningfulMessageChange(messages[index], nextMessage)) {
    return messages;
  }

  const next = [...messages];
  next[index] = nextMessage;
  return next;
};

export const buildModelErrorMessage = (
  current: ChatMessage,
  finalMessageText: string
): ChatMessage => {
  return {
    ...current,
    isError: true,
    parts: buildMessageParts({
      messageId: current.id,
      text: finalMessageText,
    }),
  };
};
