import { useMemo } from 'react';
import type { ChatMessage } from '@/shared/types/chat';
import type { PetSettings, PetSurface } from '../domain/petTypes';
import { usePetStatus } from './usePetStatus';

type UsePetControllerOptions = {
  sessionId: string;
  surface: PetSurface;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  hasInputValue: boolean;
  reasoningEnabled: boolean;
  settings: PetSettings;
};

export const usePetController = ({
  sessionId,
  surface,
  messages,
  isLoading,
  isStreaming,
  hasInputValue,
  reasoningEnabled,
  settings,
}: UsePetControllerOptions) => {
  const status = usePetStatus({
    sessionId,
    surface,
    messages,
    isLoading,
    isStreaming,
    hasInputValue,
    reasoningEnabled,
    settings,
  });

  return useMemo(
    () => ({
      visible: settings.enabled,
      status,
      settings,
    }),
    [settings, status]
  );
};
