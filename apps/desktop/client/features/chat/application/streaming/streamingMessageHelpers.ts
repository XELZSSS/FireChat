import { createThinkStreamParserState } from '@/shared/utils/streaming';
import { t } from '@/shared/utils/i18n';
import type { ChatMessage } from '@/shared/types/chat';
import { classifyFriendlyError } from '@contracts/request-log/classification';
import {
  readMessagePartState,
} from '@/shared/utils/chatMessageParts';
import { isPlainObject } from '@/shared/utils/plainObject';

type MessagePartState = ReturnType<typeof readMessagePartState>;

export type MessageOverrides = Omit<Partial<ChatMessage>, 'role' | 'parts'> & {
  text?: string;
  attachments?: MessagePartState['attachments'];
  reasoning?: string;
  reasoningStatus?: MessagePartState['reasoningStatus'];
  toolCalls?: MessagePartState['toolCalls'];
  toolResults?: MessagePartState['toolResults'];
  citations?: MessagePartState['citations'];
};

export type CachedMessageIndex = {
  id: string;
  index: number;
};

export type StreamAccumulator = {
  cleaned: string;
  reasoning: string;
  hasReasoning: boolean;
  isFirstChunk: boolean;
  pendingBuffer: string;
  parserState: ReturnType<typeof createThinkStreamParserState>;
};

type ResolvedMessageIndex = {
  cachedIndex: number;
  index: number;
};

export const createStreamAccumulator = (): StreamAccumulator => ({
  cleaned: '',
  reasoning: '',
  hasReasoning: false,
  isFirstChunk: true,
  pendingBuffer: '',
  parserState: createThinkStreamParserState(),
});

export const resetStreamAccumulator = (accumulator: StreamAccumulator | null) => {
  if (!accumulator) {
    return;
  }
  accumulator.pendingBuffer = '';
};

export const areValuesShallowEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) => areValuesShallowEqual(item, right[index]))
    );
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(right, key) &&
          areValuesShallowEqual(left[key], right[key])
      )
    );
  }

  return false;
};

export const resolveCachedMessageIndex = (
  messages: ChatMessage[],
  messageId: string,
  cached: CachedMessageIndex | null
): ResolvedMessageIndex => {
  const cachedIndex =
    cached?.id === messageId && messages[cached.index]?.id === messageId ? cached.index : -1;

  return {
    cachedIndex,
    index:
      cachedIndex >= 0 ? cachedIndex : messages.findIndex((message) => message.id === messageId),
  };
};

export const hasMeaningfulMessageChange = (current: ChatMessage, next: ChatMessage): boolean => {
  const currentPartState = readMessagePartState(current);
  const nextPartState = readMessagePartState(next);

  return (
    nextPartState.text !== currentPartState.text ||
    nextPartState.reasoning !== currentPartState.reasoning ||
    next.isError !== current.isError ||
    !areValuesShallowEqual(nextPartState.attachments, currentPartState.attachments) ||
    !areValuesShallowEqual(nextPartState.toolCalls, currentPartState.toolCalls) ||
    !areValuesShallowEqual(nextPartState.toolResults, currentPartState.toolResults) ||
    !areValuesShallowEqual(nextPartState.citations, currentPartState.citations) ||
    nextPartState.reasoningStatus !== currentPartState.reasoningStatus
  );
};

const formatUnknownValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return `${value}`;
  }
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
};

export const isAbortLikeError = (error: unknown, stopRequested: boolean): boolean => {
  const errorName = error instanceof DOMException ? error.name : '';
  const errorMessage = formatUnknownValue(error);
  return stopRequested || errorName === 'AbortError' || /aborted|abort/i.test(errorMessage);
};

export const getErrorMessage = (error: unknown): string => {
  return formatUnknownValue(error);
};

export const hasPersistableMessageContent = (message: ChatMessage | undefined): boolean => {
  if (!message) {
    return false;
  }

  const partState = readMessagePartState(message);

  return (
    partState.text.trim().length > 0 ||
    Boolean(partState.attachments.length) ||
    Boolean(partState.reasoning.trim()) ||
    Boolean(partState.reasoningStatus) ||
    Boolean(partState.toolCalls.length) ||
    Boolean(partState.toolResults.length) ||
    Boolean(partState.citations.length)
  );
};

export const buildFriendlyErrorMessage = (rawMessage: string): string => {
  const friendlyError = t(`error.${classifyFriendlyError({ message: rawMessage })}`);

  return `${friendlyError}

${t('error.troubleshooting')}
1. ${t('error.step1')}
2. ${t('error.step2')}
3. ${t('error.step3')}

${t('error.technicalDetails')}
${rawMessage}`;
};
