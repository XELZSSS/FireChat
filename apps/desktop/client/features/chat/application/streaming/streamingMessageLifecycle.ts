import type { RefObject } from 'react';
import {
  resetStreamAccumulator,
  type StreamAccumulator,
} from '@client/features/chat/application/streaming/streamingMessageHelpers';
import type { HandleSendMessageOptions } from '@client/features/chat/application/streaming/streamingMessageTypes';

type StreamEventCallbacks = Pick<HandleSendMessageOptions, 'onMessageUpdated' | 'onEvent'>;

export const assertStreamingNotStopped = (
  stopRequestedRef: RefObject<boolean>,
  signal?: AbortSignal
): void => {
  if (stopRequestedRef.current || signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
};

export const cancelScheduledStreamFlush = (streamFlushFrameRef: RefObject<number | null>): void => {
  if (streamFlushFrameRef.current !== null) {
    window.cancelAnimationFrame(streamFlushFrameRef.current);
    streamFlushFrameRef.current = null;
  }
};

export const flushBufferedStreamResponseNow = ({
  modelMessageId,
  accumulator,
  options,
  streamFlushFrameRef,
  flushBufferedStreamResponse,
}: {
  modelMessageId: string;
  accumulator: StreamAccumulator;
  options?: StreamEventCallbacks;
  streamFlushFrameRef: RefObject<number | null>;
  flushBufferedStreamResponse: (
    modelMessageId: string,
    accumulator: StreamAccumulator,
    options?: StreamEventCallbacks
  ) => void;
}) => {
  cancelScheduledStreamFlush(streamFlushFrameRef);
  flushBufferedStreamResponse(modelMessageId, accumulator, options);
};

export const scheduleBufferedStreamResponse = ({
  modelMessageId,
  accumulator,
  options,
  streamFlushFrameRef,
  flushBufferedStreamResponse,
}: {
  modelMessageId: string;
  accumulator: StreamAccumulator;
  options?: StreamEventCallbacks;
  streamFlushFrameRef: RefObject<number | null>;
  flushBufferedStreamResponse: (
    modelMessageId: string,
    accumulator: StreamAccumulator,
    options?: StreamEventCallbacks
  ) => void;
}) => {
  if (streamFlushFrameRef.current !== null) {
    return;
  }

  streamFlushFrameRef.current = window.requestAnimationFrame(() => {
    streamFlushFrameRef.current = null;
    flushBufferedStreamResponse(modelMessageId, accumulator, options);
  });
};

export const clearActiveAccumulator = ({
  streamAccumulatorRef,
  streamFlushFrameRef,
}: {
  streamAccumulatorRef: RefObject<StreamAccumulator | null>;
  streamFlushFrameRef: RefObject<number | null>;
}) => {
  cancelScheduledStreamFlush(streamFlushFrameRef);
  resetStreamAccumulator(streamAccumulatorRef.current);
  streamAccumulatorRef.current = null;
};
