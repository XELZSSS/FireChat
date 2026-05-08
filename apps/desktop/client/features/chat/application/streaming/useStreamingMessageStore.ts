import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { ChatMessage, ChatPromptInput, Role } from '@/shared/types/chat';
import {
  type CachedMessageIndex,
  type MessageOverrides,
  resolveCachedMessageIndex,
} from '@client/features/chat/application/streaming/streamingMessageHelpers';
import {
  applyStreamingMessageUpdates,
  buildModelErrorMessage,
  buildStreamingChatMessage,
  replaceMessageWhenChanged,
} from '@client/features/chat/application/streaming/streamingMessageStoreHelpers';

type UseStreamingMessageStoreOptions = {
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  messagesRef: RefObject<ChatMessage[]>;
  jumpToLatestMessage: () => void;
};

type UpdateMessageById = (messageId: string, updates: MessageOverrides) => void;

export const useStreamingMessageStore = ({
  setMessages,
  messagesRef,
  jumpToLatestMessage,
}: UseStreamingMessageStoreOptions) => {
  const lastUpdatedMessageIndexRef = useRef<CachedMessageIndex | null>(null);

  const commitMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      const next = updater(messagesRef.current);
      messagesRef.current = next;
      setMessages(next);
    },
    [messagesRef, setMessages]
  );

  const updateMessageById = useCallback<UpdateMessageById>(
    (messageId: string, updates: MessageOverrides) => {
      commitMessages((prev) => {
        const { cachedIndex, index } = resolveCachedMessageIndex(
          prev,
          messageId,
          lastUpdatedMessageIndexRef.current
        );

        if (cachedIndex < 0 && index >= 0) {
          lastUpdatedMessageIndexRef.current = { id: messageId, index };
        }
        if (index === -1) {
          return prev;
        }

        const current = prev[index];
        const nextMessage = applyStreamingMessageUpdates(current, messageId, updates);
        return replaceMessageWhenChanged(prev, index, nextMessage);
      });
    },
    [commitMessages]
  );

  const removeMessageById = useCallback(
    (messageId: string) => {
      commitMessages((prev) => prev.filter((message) => message.id !== messageId));
      if (lastUpdatedMessageIndexRef.current?.id === messageId) {
        lastUpdatedMessageIndexRef.current = null;
      }
    },
    [commitMessages]
  );

  const buildMessage = useCallback(
    (role: Role, text: string, overrides: MessageOverrides = {}): ChatMessage => {
      const { id, ...messageOverrides } = overrides;
      const messageId = id ?? uuidv4();
      return buildStreamingChatMessage(role, text, messageId, messageOverrides);
    },
    []
  );

  const startPendingModelResponse = useCallback(
    (prompt: ChatPromptInput): string => {
      const modelMessageId = uuidv4();
      const userMessage = buildMessage(Role.User, prompt.text, {
        attachments: prompt.attachments,
      });
      const modelMessage = buildMessage(Role.Model, '', {
        id: modelMessageId,
      });

      commitMessages((prev) => {
        const modelMessageIndex = prev.length + 1;
        lastUpdatedMessageIndexRef.current = { id: modelMessageId, index: modelMessageIndex };
        return [...prev, userMessage, modelMessage];
      });

      jumpToLatestMessage();

      return modelMessageId;
    },
    [buildMessage, commitMessages, jumpToLatestMessage]
  );

  const upsertModelErrorMessage = useCallback(
    (modelMessageId: string, finalMessageText: string) => {
      commitMessages((prev) => {
        const { index } = resolveCachedMessageIndex(
          prev,
          modelMessageId,
          lastUpdatedMessageIndexRef.current
        );

        if (index === -1) {
          return prev;
        }

        lastUpdatedMessageIndexRef.current = { id: modelMessageId, index };
        const next = [...prev];
        next[index] = buildModelErrorMessage(next[index], finalMessageText);
        return next;
      });
    },
    [commitMessages]
  );

  return {
    updateMessageById,
    removeMessageById,
    startPendingModelResponse,
    upsertModelErrorMessage,
  };
};
