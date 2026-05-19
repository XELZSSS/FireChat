import type { RefObject } from 'react';
import type { ChatPromptInput } from '@/shared/types/chat';
import type { ProviderResponseMetadata } from '@/infrastructure/providers/types';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type { ChatService } from '@client/features/chat/application/chatService';
import { appendThinkStreamChunk, finalizeThinkStreamParserState } from '@/shared/utils/streaming';
import type {
  HandleSendMessageOptions,
  StreamingMessageEvent,
} from '@client/features/chat/application/streaming/streamingMessageTypes';
import {
  createStreamAccumulator,
  resetStreamAccumulator,
  type MessageOverrides,
  type StreamAccumulator,
} from '@client/features/chat/application/streaming/streamingMessageHelpers';

type StreamEventCallbacks = Pick<HandleSendMessageOptions, 'onMessageUpdated' | 'onEvent'>;
type UpdateMessageById = (messageId: string, updates: MessageOverrides) => void;

const emitStreamEvent = (
  callback: HandleSendMessageOptions['onEvent'],
  event: StreamingMessageEvent
) => {
  callback?.(event);
};

export const flushBufferedStreamResponse = ({
  modelMessageId,
  accumulator,
  options,
  updateMessageById,
  autoScrollEnabledRef,
  performScrollToBottom,
}: {
  modelMessageId: string;
  accumulator: StreamAccumulator;
  options?: StreamEventCallbacks;
  updateMessageById: UpdateMessageById;
  autoScrollEnabledRef: RefObject<boolean>;
  performScrollToBottom: (behavior?: ScrollBehavior) => void;
}): void => {
  if (!accumulator.pendingBuffer) {
    return;
  }

  const delta = accumulator.pendingBuffer;
  accumulator.parserState = appendThinkStreamChunk(accumulator.parserState, delta);
  const parsed = finalizeThinkStreamParserState(accumulator.parserState);
  accumulator.cleaned = parsed.cleaned;
  accumulator.reasoning = parsed.reasoning;
  accumulator.hasReasoning = parsed.reasoning.trim().length > 0;
  accumulator.pendingBuffer = '';

  updateMessageById(modelMessageId, {
    text: accumulator.cleaned,
    reasoning: accumulator.reasoning || undefined,
    reasoningStatus: accumulator.hasReasoning ? 'streaming' : undefined,
  });

  options?.onMessageUpdated?.({
    modelMessageId,
    text: accumulator.cleaned,
    reasoning: accumulator.reasoning || undefined,
  });

  emitStreamEvent(options?.onEvent, {
    type: 'message.updated',
    properties: {
      modelMessageId,
    },
  });
  emitStreamEvent(options?.onEvent, {
    type: 'message.part.updated',
    properties: {
      modelMessageId,
      part: {
        type: 'text',
        text: accumulator.cleaned,
      },
      delta,
    },
  });

  if (accumulator.hasReasoning) {
    emitStreamEvent(options?.onEvent, {
      type: 'message.part.updated',
      properties: {
        modelMessageId,
        part: {
          type: 'reasoning',
          text: accumulator.reasoning,
        },
      },
    });
  }

  if (autoScrollEnabledRef.current) {
    window.requestAnimationFrame(() => {
      if (autoScrollEnabledRef.current) {
        performScrollToBottom('auto');
      }
    });
  }
};

export const finalizeStreamingMessage = ({
  modelMessageId,
  accumulator,
  chatService,
  updateMessageById,
  options,
}: {
  modelMessageId: string;
  accumulator: StreamAccumulator;
  chatService: ChatService;
  updateMessageById: UpdateMessageById;
  options?: StreamEventCallbacks;
}): ProviderResponseMetadata | undefined => {
  const responseMetadata = chatService.consumePendingResponseMetadata();

  updateMessageById(modelMessageId, {
    text: accumulator.cleaned,
    reasoning: accumulator.reasoning || undefined,
    reasoningStatus: accumulator.hasReasoning ? 'completed' : undefined,
    citations: responseMetadata?.citations,
  });

  emitStreamEvent(options?.onEvent, {
    type: 'message.updated',
    properties: {
      modelMessageId,
    },
  });

  if (responseMetadata?.citations?.length) {
    emitStreamEvent(options?.onEvent, {
      type: 'message.part.updated',
      properties: {
        modelMessageId,
        part: {
          type: 'citations',
          citations: responseMetadata.citations,
        },
      },
    });
  }

  return responseMetadata;
};

export const runStreamAttempt = async ({
  chatService,
  input,
  policy,
  abortController,
  requestStartedAt,
  modelMessageId,
  options,
  streamAccumulatorRef,
  clearActiveAccumulator,
  throwIfStreamingStopped,
  flushBufferedStreamResponseNow,
  scheduleBufferedStreamResponse,
  updateMessageById,
  setIsLoading,
}: {
  chatService: ChatService;
  input: ChatPromptInput;
  policy: RequestPolicy;
  abortController: AbortController;
  requestStartedAt: number;
  modelMessageId: string;
  options?: StreamEventCallbacks;
  streamAccumulatorRef: RefObject<StreamAccumulator | null>;
  clearActiveAccumulator: () => void;
  throwIfStreamingStopped: (signal?: AbortSignal) => void;
  flushBufferedStreamResponseNow: (
    modelMessageId: string,
    accumulator: StreamAccumulator,
    options?: StreamEventCallbacks
  ) => void;
  scheduleBufferedStreamResponse: (
    modelMessageId: string,
    accumulator: StreamAccumulator,
    options?: StreamEventCallbacks
  ) => void;
  updateMessageById: UpdateMessageById;
  setIsLoading: (value: boolean) => void;
}): Promise<ProviderResponseMetadata | undefined> => {
  clearActiveAccumulator();
  const accumulator = createStreamAccumulator();
  streamAccumulatorRef.current = accumulator;

  throwIfStreamingStopped(abortController.signal);

  for await (const chunk of chatService.sendMessageStream(input, abortController.signal, policy)) {
    throwIfStreamingStopped(abortController.signal);

    if (accumulator.isFirstChunk) {
      setIsLoading(false);
      accumulator.isFirstChunk = false;
      console.info(
        `[chat] first-visible-chunk provider-response ${Math.round(performance.now() - requestStartedAt)}ms`
      );
    }

    accumulator.pendingBuffer += chunk;
    scheduleBufferedStreamResponse(modelMessageId, accumulator, options);
  }

  throwIfStreamingStopped(abortController.signal);
  flushBufferedStreamResponseNow(modelMessageId, accumulator, options);
  const responseMetadata = finalizeStreamingMessage({
    modelMessageId,
    accumulator,
    chatService,
    updateMessageById,
    options,
  });

  if (streamAccumulatorRef.current === accumulator) {
    clearActiveAccumulator();
  } else {
    resetStreamAccumulator(accumulator);
  }

  return responseMetadata;
};
