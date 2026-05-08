import { useMemo } from 'react';
import type { useStreamingMessages } from '@client/features/chat/application/streaming/useStreamingMessages';
import type { ChatMessage } from '@/shared/types/chat';
import type { ReasoningLevel } from '@/infrastructure/providers/types';
import type { SendShortcut } from '@/shared/utils/appOptions';
import type { Language } from '@/shared/utils/i18n';
import type { PetSettings } from '@client/features/pet/domain/petTypes';

type StreamingState = ReturnType<typeof useStreamingMessages>;

type UseChatMainPropsOptions = {
  messages: ChatMessage[];
  currentSessionId: string;
  isSessionStateReady: boolean;
  streaming: StreamingState;
  language: Language;
  reasoningEnabled: boolean;
  reasoningControlVisible: boolean;
  reasoningLevel: ReasoningLevel;
  reasoningLevelOptions: ReasoningLevel[];
  reasoningLevelSupported: boolean;
  reasoningToggleLocked: boolean;
  sendShortcut: SendShortcut;
  showMessageTimestamps: boolean;
  wrapCodeBlocks: boolean;
  petSettings: PetSettings;
  searchEnabled: boolean;
  imageGenerationEnabled: boolean;
  imageGenerationAvailable: boolean;
  searchAvailable: boolean;
  handleReasoningLevelChange: (level: ReasoningLevel) => void;
  handleToggleReasoning: () => void;
  handleToggleSearch: () => void;
  handleToggleImageGeneration: () => void;
};

export const useChatMainProps = ({
  messages,
  currentSessionId,
  isSessionStateReady,
  streaming,
  language,
  reasoningEnabled,
  reasoningControlVisible,
  reasoningLevel,
  reasoningLevelOptions,
  reasoningLevelSupported,
  reasoningToggleLocked,
  sendShortcut,
  showMessageTimestamps,
  wrapCodeBlocks,
  petSettings,
  searchEnabled,
  imageGenerationEnabled,
  imageGenerationAvailable,
  searchAvailable,
  handleReasoningLevelChange,
  handleToggleReasoning,
  handleToggleSearch,
  handleToggleImageGeneration,
}: UseChatMainPropsOptions) => {
  const {
    isStreaming,
    isLoading,
    messagesContentRef,
    messagesContainerRef,
    messagesEndRef,
    showScrollToBottom,
    jumpToBottom,
    handleSendMessage,
    stopStreaming,
  } = streaming;

  return useMemo(
    () => ({
      language,
      sessionId: currentSessionId,
      isSessionStateReady,
      messages,
      isStreaming,
      isLoading,
      messagesContentRef,
      messagesContainerRef,
      messagesEndRef,
      showScrollToBottom,
      onJumpToBottom: jumpToBottom,
      onSendMessage: handleSendMessage,
      onStopStreaming: stopStreaming,
      reasoningEnabled,
      reasoningControlVisible,
      reasoningLevel,
      reasoningLevelOptions,
      reasoningLevelSupported,
      reasoningToggleLocked,
      sendShortcut,
      showMessageTimestamps,
      wrapCodeBlocks,
      petSettings,
      searchEnabled,
      imageGenerationEnabled,
      imageGenerationAvailable,
      searchAvailable,
      onReasoningLevelChange: handleReasoningLevelChange,
      onToggleReasoning: handleToggleReasoning,
      onToggleSearch: handleToggleSearch,
      onToggleImageGeneration: handleToggleImageGeneration,
    }),
    [
      currentSessionId,
      handleReasoningLevelChange,
      handleSendMessage,
      handleToggleReasoning,
      handleToggleSearch,
      handleToggleImageGeneration,
      isLoading,
      isSessionStateReady,
      isStreaming,
      jumpToBottom,
      language,
      messages,
      messagesContainerRef,
      messagesContentRef,
      messagesEndRef,
      reasoningControlVisible,
      reasoningEnabled,
      reasoningLevel,
      reasoningLevelOptions,
      reasoningLevelSupported,
      reasoningToggleLocked,
      searchAvailable,
      searchEnabled,
      imageGenerationEnabled,
      imageGenerationAvailable,
      sendShortcut,
      showMessageTimestamps,
      petSettings,
      showScrollToBottom,
      stopStreaming,
      wrapCodeBlocks,
    ]
  );
};
