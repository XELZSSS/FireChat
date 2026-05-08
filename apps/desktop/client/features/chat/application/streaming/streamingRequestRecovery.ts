import {
  buildFriendlyErrorMessage,
  getErrorMessage,
  isAbortLikeError,
  type MessageOverrides,
  type StreamAccumulator,
} from '@client/features/chat/application/streaming/streamingMessageHelpers';
import type { HandleSendMessageOptions } from '@client/features/chat/application/streaming/streamingMessageTypes';
import type { RefObject } from 'react';
import type { ProviderResponseMetadata } from '@/infrastructure/providers/types';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type { ChatPromptInput } from '@/shared/types/chat';
import type { ChatService } from '@client/features/chat/application/chatService';
import type { runStreamAttempt } from '@client/features/chat/application/streaming/streamingRequestAttempt';
import { appendChatRequestLog } from '@client/features/chat/application/streaming/streamingRequestLogging';

type StreamEventCallbacks = Pick<HandleSendMessageOptions, 'onMessageUpdated' | 'onEvent'>;
type UpdateMessageById = (messageId: string, updates: MessageOverrides) => void;

export const executeStreamRequest = async ({
  chatService,
  input,
  initialPolicy,
  abortController,
  requestStartedAt,
  modelMessageId,
  options,
  stopRequestedRef,
  streamAccumulatorRef,
  clearActiveAccumulator,
  throwIfStreamingStopped,
  flushBufferedStreamResponseNow,
  scheduleBufferedStreamResponse,
  updateMessageById,
  upsertModelErrorMessage,
  setIsLoading,
  runStreamAttemptFn,
}: {
  chatService: ChatService;
  input: ChatPromptInput;
  initialPolicy: RequestPolicy;
  abortController: AbortController;
  requestStartedAt: number;
  modelMessageId: string;
  options?: StreamEventCallbacks;
  stopRequestedRef: RefObject<boolean>;
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
  upsertModelErrorMessage: (modelMessageId: string, finalMessageText: string) => void;
  setIsLoading: (value: boolean) => void;
  runStreamAttemptFn: typeof runStreamAttempt;
}): Promise<{ status: 'completed' | 'aborted' | 'error'; errorMessage?: string }> => {
  let responseMetadata: ProviderResponseMetadata | undefined;

  try {
    responseMetadata = await runStreamAttemptFn({
      chatService,
      input,
      policy: initialPolicy,
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
    });

    appendChatRequestLog({
      chatService,
      requestStartedAt,
      status: stopRequestedRef.current ? 'aborted' : 'success',
      responseMetadata,
    });

    return {
      status: stopRequestedRef.current ? 'aborted' : 'completed',
    };
  } catch (error: unknown) {
    if (isAbortLikeError(error, stopRequestedRef.current)) {
      responseMetadata = chatService.consumePendingResponseMetadata();
      appendChatRequestLog({
        chatService,
        requestStartedAt,
        status: 'aborted',
        responseMetadata,
      });

      return {
        status: 'aborted',
      };
    }

    console.error('Chat error:', error);
    const errorMessage = buildFriendlyErrorMessage(getErrorMessage(error));
    upsertModelErrorMessage(modelMessageId, errorMessage);
    responseMetadata = chatService.consumePendingResponseMetadata();
    appendChatRequestLog({
      chatService,
      requestStartedAt,
      status: 'error',
      error,
      responseMetadata,
    });

    return {
      status: 'error',
      errorMessage,
    };
  }
};
