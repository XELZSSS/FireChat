import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage } from '@/shared/types/chat';
import { Role } from '@/shared/types/chat';
import { getMessageReasoningStatus, getMessageText } from '@/shared/utils/chatMessageParts';
import type { PetSettings, PetSurface } from '../domain/petTypes';
import { resolvePetStatus } from '../domain/petState';

type UsePetStatusOptions = {
  sessionId: string;
  surface: PetSurface;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  hasInputValue: boolean;
  reasoningEnabled: boolean;
  settings: PetSettings;
};

type TimedStatusState = {
  key: string;
  active: boolean;
};

const SUCCESS_DURATION_MS = 1600;
const ERROR_DURATION_MS = 2600;
const INACTIVE_DURATION_MS = 90000;

const getLastModelMessage = (messages: ChatMessage[]): ChatMessage | null => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== Role.User) {
      return message;
    }
  }

  return null;
};

const hasErrorMessage = (message: ChatMessage | null): boolean => {
  if (!message) return false;
  return message.isError === true;
};

export const usePetStatus = ({
  sessionId,
  surface,
  messages,
  isLoading,
  isStreaming,
  hasInputValue,
  reasoningEnabled,
  settings,
}: UsePetStatusOptions) => {
  const viewKey = `${sessionId}:${surface}`;
  const [lastReplyCompleted, setLastReplyCompleted] = useState<TimedStatusState>({
    key: viewKey,
    active: false,
  });
  const [hasRecentError, setHasRecentError] = useState<TimedStatusState>({
    key: viewKey,
    active: false,
  });
  const [isInactive, setIsInactive] = useState<TimedStatusState>({
    key: viewKey,
    active: false,
  });
  const wasBusyRef = useRef(false);
  const messageCountRef = useRef(messages.length);

  const activeModelMessage = useMemo(() => getLastModelMessage(messages), [messages]);
  const currentMessageKey = activeModelMessage?.id ?? '';
  const isThinking = useMemo(() => {
    if (!isLoading && !isStreaming) {
      return false;
    }

    if (activeModelMessage && getMessageReasoningStatus(activeModelMessage) === 'streaming') {
      return true;
    }

    return (
      reasoningEnabled &&
      (isLoading ||
        (isStreaming && Boolean(activeModelMessage && !getMessageText(activeModelMessage).trim())))
    );
  }, [activeModelMessage, isLoading, isStreaming, reasoningEnabled]);

  useEffect(() => {
    const wasBusy = wasBusyRef.current;
    const isBusy = isLoading || isStreaming;
    wasBusyRef.current = isBusy;

    if (!isBusy && wasBusy && settings.reactions && !hasErrorMessage(activeModelMessage)) {
      setLastReplyCompleted({ key: viewKey, active: true });
      const timeoutId = window.setTimeout(
        () => setLastReplyCompleted({ key: viewKey, active: false }),
        SUCCESS_DURATION_MS
      );
      return () => window.clearTimeout(timeoutId);
    }
  }, [activeModelMessage, isLoading, isStreaming, settings.reactions, viewKey]);

  useEffect(() => {
    if (!hasErrorMessage(activeModelMessage) || !settings.reactions) {
      return;
    }

    const startTimeoutId = window.setTimeout(
      () => setHasRecentError({ key: viewKey, active: true }),
      0
    );
    const endTimeoutId = window.setTimeout(
      () => setHasRecentError({ key: viewKey, active: false }),
      ERROR_DURATION_MS
    );
    return () => {
      window.clearTimeout(startTimeoutId);
      window.clearTimeout(endTimeoutId);
    };
  }, [activeModelMessage, currentMessageKey, settings.reactions, viewKey]);

  useEffect(() => {
    const changed =
      hasInputValue || isLoading || isStreaming || messages.length !== messageCountRef.current;
    messageCountRef.current = messages.length;

    if (changed) {
      setIsInactive({ key: viewKey, active: false });
    }

    const timeoutId = window.setTimeout(
      () => setIsInactive({ key: viewKey, active: true }),
      INACTIVE_DURATION_MS
    );
    return () => window.clearTimeout(timeoutId);
  }, [hasInputValue, isLoading, isStreaming, messages.length, viewKey]);

  return resolvePetStatus({
    hasInputValue,
    isLoading,
    isStreaming,
    isThinking,
    lastReplyCompleted: lastReplyCompleted.key === viewKey && lastReplyCompleted.active,
    hasRecentError: hasRecentError.key === viewKey && hasRecentError.active,
    isInactive: isInactive.key === viewKey && isInactive.active,
    reactions: settings.reactions,
  });
};
