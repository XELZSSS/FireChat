import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ReasoningLevel } from '@/infrastructure/providers/types';

type UseAppControllerHandlersOptions = {
  isStreaming: boolean;
  isLoading: boolean;
  startNewChat: () => void;
  setSearchEnabled: Dispatch<SetStateAction<boolean>>;
  setImageGenerationEnabled: Dispatch<SetStateAction<boolean>>;
  imageGenerationAvailable: boolean;
  setReasoningEnabled: Dispatch<SetStateAction<boolean>>;
  setReasoningLevel: (level: ReasoningLevel) => void;
  sidebarCollapsed: boolean;
  handleSetSidebarCollapsed: (collapsed: boolean) => void;
};

export const useAppControllerHandlers = ({
  isStreaming,
  isLoading,
  startNewChat,
  setSearchEnabled,
  setImageGenerationEnabled,
  imageGenerationAvailable,
  setReasoningEnabled,
  setReasoningLevel,
  sidebarCollapsed,
  handleSetSidebarCollapsed,
}: UseAppControllerHandlersOptions) => {
  const handleNewChatClick = useCallback(() => {
    if (isStreaming || isLoading) return;
    startNewChat();
  }, [isLoading, isStreaming, startNewChat]);

  const handleToggleSearch = useCallback(() => {
    setSearchEnabled((prev) => !prev);
  }, [setSearchEnabled]);

  const handleToggleImageGeneration = useCallback(() => {
    if (!imageGenerationAvailable) {
      return;
    }
    setImageGenerationEnabled((prev) => !prev);
  }, [imageGenerationAvailable, setImageGenerationEnabled]);

  const handleToggleReasoning = useCallback(() => {
    setReasoningEnabled((prev) => !prev);
  }, [setReasoningEnabled]);

  const handleReasoningLevelChange = useCallback(
    (level: ReasoningLevel) => {
      setReasoningLevel(level);
    },
    [setReasoningLevel]
  );

  const handleToggleSidebarCollapsed = useCallback(() => {
    handleSetSidebarCollapsed(!sidebarCollapsed);
  }, [handleSetSidebarCollapsed, sidebarCollapsed]);

  return {
    handleNewChatClick,
    handleReasoningLevelChange,
    handleToggleImageGeneration,
    handleToggleReasoning,
    handleToggleSearch,
    handleToggleSidebarCollapsed,
  };
};
