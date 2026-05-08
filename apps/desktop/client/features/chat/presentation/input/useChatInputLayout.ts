import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

type UseChatInputLayoutOptions = {
  containerRef: RefObject<HTMLDivElement | null>;
};

export const useChatInputLayout = ({ containerRef }: UseChatInputLayoutOptions) => {
  const lastHeightRef = useRef<number | null>(null);
  const heightSyncFrameRef = useRef<number | null>(null);

  const updateChatInputHeight = useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    const nextHeight = containerRef.current.offsetHeight;
    if (lastHeightRef.current === nextHeight) {
      return;
    }

    lastHeightRef.current = nextHeight;
    document.documentElement.style.setProperty('--chat-input-height', `${nextHeight}px`);
  }, [containerRef]);

  const scheduleChatInputHeightSync = useCallback(() => {
    if (heightSyncFrameRef.current !== null) {
      window.cancelAnimationFrame(heightSyncFrameRef.current);
    }

    heightSyncFrameRef.current = window.requestAnimationFrame(() => {
      heightSyncFrameRef.current = null;
      updateChatInputHeight();
    });
  }, [updateChatInputHeight]);

  const syncChatInputLayout = useCallback(() => {
    scheduleChatInputHeightSync();
  }, [scheduleChatInputHeightSync]);

  useEffect(() => {
    syncChatInputLayout();
  }, [syncChatInputLayout]);

  useEffect(() => {
    scheduleChatInputHeightSync();
    const observer = new ResizeObserver(() => scheduleChatInputHeightSync());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', scheduleChatInputHeightSync);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleChatInputHeightSync);
      if (heightSyncFrameRef.current !== null) {
        window.cancelAnimationFrame(heightSyncFrameRef.current);
        heightSyncFrameRef.current = null;
      }
    };
  }, [containerRef, scheduleChatInputHeightSync]);

  return {
    syncChatInputLayout,
  };
};
