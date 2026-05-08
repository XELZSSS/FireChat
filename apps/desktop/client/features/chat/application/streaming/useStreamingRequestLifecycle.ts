import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { StreamAccumulator } from '@client/features/chat/application/streaming/streamingMessageHelpers';
import { clearActiveAccumulator as clearActiveAccumulatorState } from '@client/features/chat/application/streaming/streamingMessageLifecycle';

type UseStreamingRequestLifecycleOptions = {
  autoScrollEnabledRef: RefObject<boolean>;
};

export const useStreamingRequestLifecycle = ({
  autoScrollEnabledRef,
}: UseStreamingRequestLifecycleOptions) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const stopRequestedRef = useRef(false);
  const activeStreamAbortControllerRef = useRef<AbortController | null>(null);
  const streamAccumulatorRef = useRef<StreamAccumulator | null>(null);
  const streamFlushFrameRef = useRef<number | null>(null);

  const clearActiveAccumulator = useCallback(() => {
    clearActiveAccumulatorState({
      streamAccumulatorRef,
      streamFlushFrameRef,
    });
  }, []);

  const prepareStreamingRequest = useCallback(() => {
    stopRequestedRef.current = false;
    activeStreamAbortControllerRef.current?.abort();
  }, []);

  const createStreamAbortController = useCallback(() => {
    const abortController = new AbortController();
    activeStreamAbortControllerRef.current = abortController;
    return abortController;
  }, []);

  const markStreamingStarted = useCallback(() => {
    setIsStreaming(true);
    setIsLoading(true);
  }, []);

  const finishStreamingRequest = useCallback(
    (abortController: AbortController) => {
      clearActiveAccumulator();
      if (activeStreamAbortControllerRef.current === abortController) {
        activeStreamAbortControllerRef.current = null;
      }

      setIsStreaming(false);
      setIsLoading(false);
      autoScrollEnabledRef.current = false;
    },
    [autoScrollEnabledRef, clearActiveAccumulator]
  );

  const stopStreaming = useCallback(() => {
    stopRequestedRef.current = true;
    autoScrollEnabledRef.current = false;
    activeStreamAbortControllerRef.current?.abort();
    activeStreamAbortControllerRef.current = null;
    clearActiveAccumulator();
    setIsStreaming(false);
    setIsLoading(false);
  }, [autoScrollEnabledRef, clearActiveAccumulator]);

  useEffect(() => {
    return () => {
      activeStreamAbortControllerRef.current?.abort();
      activeStreamAbortControllerRef.current = null;
      clearActiveAccumulator();
    };
  }, [clearActiveAccumulator]);

  return {
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
  };
};
