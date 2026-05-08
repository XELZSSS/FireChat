import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChatBubble from '@client/features/chat/presentation/message-parts/ChatBubble';
import {
  ESTIMATED_MESSAGE_HEIGHT,
  MESSAGE_END_HEIGHT,
  MESSAGES_CONTENT_CLASS,
  MESSAGES_SHELL_CLASS,
} from '@client/features/chat/presentation/shell/chatMainConstants';
import type { ChatMessage } from '@/shared/types/chat';
import type { Language } from '@/shared/utils/i18n';
import type { ChatMessageListRenderProps } from '@client/features/chat/presentation/message-list/chatMessageListTypes';
import { findVisibleMessageRange } from '@client/features/chat/presentation/message-list/chatMessageListUtils';

type MeasuredMessageProps = {
  top: number;
  language: Language;
  message: ChatMessage;
  isStreaming: boolean;
  showMessageTimestamps: boolean;
  wrapCodeBlocks: boolean;
  onHeightChange: (messageId: string, height: number) => void;
};

const MeasuredMessage = memo(function MeasuredMessage({
  top,
  language,
  message,
  isStreaming,
  showMessageTimestamps,
  wrapCodeBlocks,
  onHeightChange,
}: MeasuredMessageProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) {
      return;
    }

    const measure = () => {
      onHeightChange(message.id, Math.max(1, Math.ceil(row.getBoundingClientRect().height)));
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => {
      observer.disconnect();
    };
  }, [message.id, onHeightChange]);

  return (
    <div
      ref={rowRef}
      className="absolute left-0 right-0 flow-root"
      style={{
        transform: `translateY(${top}px)`,
      }}
    >
      <ChatBubble
        language={language}
        message={message}
        isStreaming={isStreaming}
        showMessageTimestamps={showMessageTimestamps}
        wrapCodeBlocks={wrapCodeBlocks}
      />
    </div>
  );
});

const ChatVirtualizedMessageList = memo(function ChatVirtualizedMessageList({
  language,
  messages,
  streamingMessageId,
  showMessageTimestamps,
  wrapCodeBlocks,
  messagesContentRef,
  messagesContainerRef,
  messagesEndRef,
}: ChatMessageListRenderProps) {
  const frameRef = useRef<number | null>(null);
  const [viewport, setViewport] = useState({ height: 0, scrollTop: 0 });
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});

  const syncViewport = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    setViewport({
      height: container.clientHeight,
      scrollTop: container.scrollTop,
    });
  }, [messagesContainerRef]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    syncViewport();

    const scheduleSync = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        syncViewport();
      });
    };

    const observer = new ResizeObserver(scheduleSync);
    observer.observe(container);
    container.addEventListener('scroll', scheduleSync, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', scheduleSync);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [messagesContainerRef, syncViewport]);

  useEffect(() => {
    syncViewport();
  }, [messages.length, syncViewport]);

  useEffect(() => {
    const messageIds = new Set(messages.map((message) => message.id));

    setMeasuredHeights((current) => {
      let didRemoveHeight = false;
      const next: Record<string, number> = {};

      Object.entries(current).forEach(([messageId, height]) => {
        if (messageIds.has(messageId)) {
          next[messageId] = height;
        } else {
          didRemoveHeight = true;
        }
      });

      return didRemoveHeight ? next : current;
    });
  }, [messages]);

  const onHeightChange = useCallback((messageId: string, height: number) => {
    setMeasuredHeights((current) =>
      current[messageId] === height
        ? current
        : {
            ...current,
            [messageId]: height,
          }
    );
  }, []);

  const metrics = useMemo(() => {
    const heights = messages.map(
      (message) => measuredHeights[message.id] ?? ESTIMATED_MESSAGE_HEIGHT
    );
    const offsets: number[] = [];
    let totalHeight = 0;

    heights.forEach((height) => {
      offsets.push(totalHeight);
      totalHeight += height;
    });

    return {
      heights,
      offsets,
      totalHeight: totalHeight + MESSAGE_END_HEIGHT,
    };
  }, [measuredHeights, messages]);

  const visibleRange = useMemo(
    () =>
      findVisibleMessageRange({
        offsets: metrics.offsets,
        heights: metrics.heights,
        scrollTop: viewport.scrollTop,
        viewportHeight: viewport.height,
      }),
    [metrics.heights, metrics.offsets, viewport.height, viewport.scrollTop]
  );
  const visibleMessages = messages.slice(visibleRange.start, visibleRange.end + 1);

  return (
    <div
      ref={messagesContentRef}
      className={`${MESSAGES_CONTENT_CLASS} relative`}
      style={{
        height: metrics.totalHeight,
      }}
    >
      <div className={`${MESSAGES_SHELL_CLASS} relative`} style={{ height: metrics.totalHeight }}>
        {visibleMessages.map((message, offset) => (
          <MeasuredMessage
            key={message.id}
            top={metrics.offsets[visibleRange.start + offset] ?? 0}
            language={language}
            message={message}
            isStreaming={message.id === streamingMessageId}
            showMessageTimestamps={showMessageTimestamps}
            wrapCodeBlocks={wrapCodeBlocks}
            onHeightChange={onHeightChange}
          />
        ))}
        <div
          ref={messagesEndRef}
          className="absolute left-0 right-0 h-px"
          style={{ top: metrics.totalHeight - MESSAGE_END_HEIGHT }}
        />
      </div>
    </div>
  );
});

export default ChatVirtualizedMessageList;

