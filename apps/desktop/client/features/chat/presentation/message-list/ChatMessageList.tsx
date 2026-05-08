import { memo } from 'react';
import ChatStandardMessageList from '@client/features/chat/presentation/message-list/ChatStandardMessageList';
import ChatVirtualizedMessageList from '@client/features/chat/presentation/message-list/ChatVirtualizedMessageList';
import { MESSAGE_VIRTUALIZATION_THRESHOLD } from '@client/features/chat/presentation/shell/chatMainConstants';
import type { ChatMessageListProps } from '@client/features/chat/presentation/message-list/chatMessageListTypes';
import { getStreamingMessageId } from '@client/features/chat/presentation/message-list/chatMessageListUtils';

const ChatMessageList = memo(function ChatMessageList(props: ChatMessageListProps) {
  const streamingMessageId = getStreamingMessageId(props.messages, props.isStreaming);
  const shouldVirtualize = props.messages.length >= MESSAGE_VIRTUALIZATION_THRESHOLD;

  if (shouldVirtualize) {
    return <ChatVirtualizedMessageList {...props} streamingMessageId={streamingMessageId} />;
  }

  return <ChatStandardMessageList {...props} streamingMessageId={streamingMessageId} />;
});

export default ChatMessageList;

