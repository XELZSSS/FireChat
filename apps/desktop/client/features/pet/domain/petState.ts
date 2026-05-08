import type { PetStatus } from './petTypes';

export type PetStatusInput = {
  hasInputValue: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  isThinking: boolean;
  lastReplyCompleted: boolean;
  hasRecentError: boolean;
  isInactive: boolean;
  reactions: boolean;
};

export const resolvePetStatus = ({
  hasInputValue,
  isLoading,
  isStreaming,
  isThinking,
  lastReplyCompleted,
  hasRecentError,
  isInactive,
  reactions,
}: PetStatusInput): PetStatus => {
  if (isThinking) return 'thinking';
  if (isStreaming) return 'responding';
  if (isLoading) return 'waiting';
  if (hasRecentError) return 'error';
  if (reactions && lastReplyCompleted) return 'success';
  if (hasInputValue) return 'typing';
  if (isInactive) return 'sleeping';
  return 'idle';
};
