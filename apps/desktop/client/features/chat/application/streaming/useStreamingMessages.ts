import { useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ChatService } from '@client/features/chat/application/chatService';
import { decideRequestPolicyFromPrompt } from '@/infrastructure/providers/requestPolicy';
import { loadAppSettings } from '@/infrastructure/persistence/appSettingsStore';
import type { ChatMessage, ChatPromptInput } from '@/shared/types/chat';
import {
  hasPersistableMessageContent,
  type StreamAccumulator,
} from '@client/features/chat/application/streaming/streamingMessageHelpers';
import {
  flushBufferedStreamResponse as flushStreamAccumulator,
  runStreamAttempt,
} from '@client/features/chat/application/streaming/streamingRequestAttempt';
import { executeStreamRequest } from '@client/features/chat/application/streaming/streamingRequestRecovery';
export type {
  HandleSendMessageOptions,
  HandleSendMessageResult,
  StreamingMessageEvent,
  StreamingMessagePart,
  StreamingMessageUpdate,
} from '@client/features/chat/application/streaming/streamingMessageTypes';
import type {
  HandleSendMessageOptions,
  HandleSendMessageResult,
} from '@client/features/chat/application/streaming/streamingMessageTypes';
import {
  assertStreamingNotStopped,
  flushBufferedStreamResponseNow as flushBufferedStreamResponseNowState,
  scheduleBufferedStreamResponse as scheduleBufferedStreamResponseState,
} from '@client/features/chat/application/streaming/streamingMessageLifecycle';
import { useStreamingMessageStore } from '@client/features/chat/application/streaming/useStreamingMessageStore';
import { useStreamingRequestLifecycle } from '@client/features/chat/application/streaming/useStreamingRequestLifecycle';
import { useStreamingViewport } from '@client/features/chat/application/streaming/useStreamingViewport';
import { runChatStreamingPipeline } from '@chat-core/index';

type UseStreamingMessagesOptions = {
  chatService: ChatService;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  commitCurrentSessionNow?: () => void;
};

export const useStreamingMessages = ({
  chatService,
  messages,
  setMessages,
  commitCurrentSessionNow,
}: UseStreamingMessagesOptions) => {
  const messagesRef = useRef(messages);

  const {
    messagesContentRef,
    messagesEndRef,
    messagesContainerRef,
    showScrollToBottom,
    jumpToBottom,
    jumpToLatestMessage,
    performScrollToBottom,
    autoScrollEnabledRef,
  } = useStreamingViewport({ messages, messagesRef });

  const {
    isStreaming,
    isLoading,
    setIsLoading,
    stopRequestedRef,
    streamAccumulatorRef,
    streamFlushFrameRef,
    prepareStreamingRequest,
    createStreamAbortController,
    markStreamingStarted,
    finishStreamingRequest,
    clearActiveAccumulator,
    stopStreaming,
  } = useStreamingRequestLifecycle({ autoScrollEnabledRef });

  const {
    updateMessageById,
    removeMessageById,
    startPendingModelResponse,
    upsertModelErrorMessage,
  } = useStreamingMessageStore({
    setMessages,
    messagesRef,
    jumpToLatestMessage,
  });

  const syncHistory = useCallback(() => {
    void chatService.startChatWithHistory(messagesRef.current).catch((error) => {
      console.error('Failed to synchronize chat history:', error);
    });
  }, [chatService]);

  const flushBufferedStreamResponse = useCallback(
    (
      modelMessageId: string,
      accumulator: StreamAccumulator,
      options?: Pick<HandleSendMessageOptions, 'onMessageUpdated' | 'onEvent'>
    ) => {
      flushStreamAccumulator({
        modelMessageId,
        accumulator,
        options,
        updateMessageById,
        autoScrollEnabledRef,
        performScrollToBottom,
      });
    },
    [autoScrollEnabledRef, performScrollToBottom, updateMessageById]
  );

  const throwIfStreamingStopped = useCallback(
    (signal?: AbortSignal) => {
      assertStreamingNotStopped(stopRequestedRef, signal);
    },
    [stopRequestedRef]
  );

  const flushBufferedStreamResponseNow = useCallback(
    (
      modelMessageId: string,
      accumulator: StreamAccumulator,
      options?: Pick<HandleSendMessageOptions, 'onMessageUpdated' | 'onEvent'>
    ) =>
      flushBufferedStreamResponseNowState({
        modelMessageId,
        accumulator,
        options,
        streamFlushFrameRef,
        flushBufferedStreamResponse,
      }),
    [flushBufferedStreamResponse, streamFlushFrameRef]
  );

  const scheduleBufferedStreamResponse = useCallback(
    (
      modelMessageId: string,
      accumulator: StreamAccumulator,
      options?: Pick<HandleSendMessageOptions, 'onMessageUpdated' | 'onEvent'>
    ) =>
      scheduleBufferedStreamResponseState({
        modelMessageId,
        accumulator,
        options,
        streamFlushFrameRef,
        flushBufferedStreamResponse,
      }),
    [flushBufferedStreamResponse, streamFlushFrameRef]
  );

  const handleSendMessage = useCallback(
    async (
      input: ChatPromptInput,
      options: HandleSendMessageOptions = {}
    ): Promise<HandleSendMessageResult> => {
      const result = await runChatStreamingPipeline({
        input,
        prepareStreamingRequest,
        consumePendingResponseMetadata: () => {
          chatService.consumePendingResponseMetadata();
        },
        createStreamAbortController,
        startPendingModelResponse,
        getCurrentMessages: () => messagesRef.current,
        onStarted: options.onStarted,
        markStreamingStarted,
        buildRequestPolicy: (promptInput) =>
          decideRequestPolicyFromPrompt(promptInput.text, {
            toolCallMaxRounds: loadAppSettings().toolCallMaxRounds,
          }),
        executeStreamRequest: ({
          input: streamInput,
          policy,
          abortController,
          requestStartedAt,
          modelMessageId,
        }) =>
          executeStreamRequest({
            chatService,
            input: streamInput,
            initialPolicy: policy,
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
            runStreamAttemptFn: runStreamAttempt,
          }),
        finishStreamingRequest,
        isStopRequested: () => stopRequestedRef.current,
        getMessageId: (message) => message.id,
        hasPersistableMessageContent,
        removeMessageById,
        getExecutionStatus: (executionResult) => executionResult.status,
        getExecutionErrorMessage: (executionResult) => executionResult.errorMessage,
        syncHistory,
        commitCurrentSessionNow,
      });

      return result;
    },
    [
      chatService,
      commitCurrentSessionNow,
      createStreamAbortController,
      finishStreamingRequest,
      flushBufferedStreamResponseNow,
      clearActiveAccumulator,
      markStreamingStarted,
      prepareStreamingRequest,
      removeMessageById,
      scheduleBufferedStreamResponse,
      setIsLoading,
      startPendingModelResponse,
      stopRequestedRef,
      streamAccumulatorRef,
      syncHistory,
      throwIfStreamingStopped,
      updateMessageById,
      upsertModelErrorMessage,
    ]
  );

  return {
    messagesContentRef,
    messagesEndRef,
    messagesContainerRef,
    isStreaming,
    isLoading,
    showScrollToBottom,
    jumpToBottom,
    handleSendMessage,
    stopStreaming,
  };
};
