import { useCallback } from 'react';
import type { ReasoningLevel } from '@/infrastructure/providers/types';

type UseAppControllerHandlersOptions = {
  isStreaming: boolean;
  isLoading: boolean;
  startNewChat: () => void;
  setReasoningEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setReasoningLevel: (level: ReasoningLevel) => void;
  sidebarCollapsed: boolean;
  handleSetSidebarCollapsed: (collapsed: boolean) => void;
};

export const useAppControllerHandlers = ({
  isStreaming,
  isLoading,
  startNewChat,
  setReasoningEnabled,
  setReasoningLevel,
  sidebarCollapsed,
  handleSetSidebarCollapsed,
}: UseAppControllerHandlersOptions) => {
  const handleNewChatClick = useCallback(() => {
    if (isStreaming || isLoading) return;
    startNewChat();
  }, [isLoading, isStreaming, startNewChat]);

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
    handleToggleReasoning,
    handleToggleSidebarCollapsed,
  };
};
