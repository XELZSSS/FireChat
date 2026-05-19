import { memo } from 'react';
import ChatBubble from '@client/features/chat/presentation/message-parts/ChatBubble';
import {
  MESSAGES_CONTENT_CLASS,
  MESSAGES_SHELL_CLASS,
} from '@client/features/chat/presentation/shell/chatMainConstants';
import type { ChatMessageListRenderProps } from '@client/features/chat/presentation/message-list/chatMessageListTypes';

const ChatStandardMessageList = memo(function ChatStandardMessageList({
  language,
  messages,
  streamingMessageId,
  showMessageTimestamps,
  wrapCodeBlocks,
  messagesContentRef,
  messagesEndRef,
  scrollPaddingBottom,
}: Omit<ChatMessageListRenderProps, 'messagesContainerRef'>) {
  return (
    <div
      ref={messagesContentRef}
      className={MESSAGES_CONTENT_CLASS}
      style={{ paddingBottom: scrollPaddingBottom }}
    >
      <div className={MESSAGES_SHELL_CLASS}>
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            language={language}
            message={message}
            isStreaming={message.id === streamingMessageId}
            showMessageTimestamps={showMessageTimestamps}
            wrapCodeBlocks={wrapCodeBlocks}
          />
        ))}
        <div ref={messagesEndRef} className="h-px" />
      </div>
    </div>
  );
});

export default ChatStandardMessageList;
