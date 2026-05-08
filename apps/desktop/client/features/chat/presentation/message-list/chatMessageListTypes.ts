import type { RefObject } from 'react';
import type { ChatMessage } from '@/shared/types/chat';
import type { Language } from '@/shared/utils/i18n';

export type ChatMessageListProps = {
  language: Language;
  messages: ChatMessage[];
  isStreaming: boolean;
  showMessageTimestamps: boolean;
  wrapCodeBlocks: boolean;
  messagesContentRef: RefObject<HTMLDivElement | null>;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollPaddingBottom: string;
};

export type ChatMessageListRenderProps = Omit<ChatMessageListProps, 'isStreaming'> & {
  streamingMessageId: string | null;
};
