import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import type { ChatService } from '@client/features/chat/application/chatService';
import type { ChatMessage, ChatSession } from '@/shared/types/chat';
import {
  buildSessionSnapshot,
  hasSessionSnapshotChanged,
} from '@client/features/sessions/application/session/sessionHelpers';

type CommitSessionOptions = { force?: boolean };

type UseSessionDraftPersistenceOptions = {
  chatService: ChatService;
  messages: ChatMessage[];
  currentSessionId: string;
  currentSession?: ChatSession;
  sessions: ChatSession[];
  defaultSessionTitle: string;
  isStreaming: boolean;
  isLoading: boolean;
  pendingSessionSaveRef: RefObject<ReturnType<typeof buildSessionSnapshot> | null>;
  lastPersistedSessionRef: RefObject<ReturnType<typeof buildSessionSnapshot> | null>;
  saveSessionTimerRef: RefObject<number | null>;
  deletedSessionIdsRef: RefObject<Set<string>>;
  scheduleSessionSave: (snapshot: ReturnType<typeof buildSessionSnapshot>) => void;
  persistSessionSnapshot: (snapshot: ReturnType<typeof buildSessionSnapshot>) => Promise<void>;
};

export const useSessionDraftPersistence = ({
  chatService,
  messages,
  currentSessionId,
  currentSession,
  sessions,
  defaultSessionTitle,
  isStreaming,
  isLoading,
  pendingSessionSaveRef,
  lastPersistedSessionRef,
  saveSessionTimerRef,
  deletedSessionIdsRef,
  scheduleSessionSave,
  persistSessionSnapshot,
}: UseSessionDraftPersistenceOptions) => {
  const conversationContext = chatService.getConversationContext();
  const conversationProviderId = conversationContext.providerId;
  const conversationModelName = conversationContext.modelName;

  const buildActiveSessionSnapshot = useCallback((updatedAt: number) => {
    if (messages.length === 0) return null;

    return buildSessionSnapshot({
      currentSessionId,
      existingSessionTitle: currentSession?.title,
      existingSessionCreatedAt: currentSession?.createdAt,
      messages,
      defaultSessionTitle,
      providerId: conversationProviderId,
      modelName: conversationModelName,
      cliSessionIds: chatService.getCliSessionIds(),
      updatedAt,
    });
  }, [
    chatService,
    conversationModelName,
    conversationProviderId,
    currentSession?.createdAt,
    currentSession?.title,
    currentSessionId,
    defaultSessionTitle,
    messages,
  ]);

  const buildChangedSessionDraft = useCallback(() => {
    const referenceSession = lastPersistedSessionRef.current ?? currentSession;
    const stableSnapshot = buildActiveSessionSnapshot(referenceSession?.updatedAt ?? Date.now());
    if (!stableSnapshot || !hasSessionSnapshotChanged(referenceSession, stableSnapshot)) {
      return null;
    }

    return buildActiveSessionSnapshot(Date.now());
  }, [buildActiveSessionSnapshot, currentSession, lastPersistedSessionRef]);

  useEffect(() => {
    const draft = buildChangedSessionDraft();

    if (!draft || deletedSessionIdsRef.current.has(draft.id)) {
      return;
    }

    pendingSessionSaveRef.current = draft;
    if (isStreaming || isLoading) {
      return;
    }

    if (!hasSessionSnapshotChanged(lastPersistedSessionRef.current ?? undefined, draft)) {
      return;
    }

    scheduleSessionSave(draft);
  }, [
    buildChangedSessionDraft,
    deletedSessionIdsRef,
    isLoading,
    isStreaming,
    lastPersistedSessionRef,
    pendingSessionSaveRef,
    scheduleSessionSave,
  ]);

  const commitCurrentSession = useCallback(
    async (_options: CommitSessionOptions = {}) => {
      const draft = pendingSessionSaveRef.current ?? buildChangedSessionDraft();
      if (!draft) {
        return;
      }

      if (!hasSessionSnapshotChanged(lastPersistedSessionRef.current ?? undefined, draft)) {
        return;
      }

      await persistSessionSnapshot(draft);
      pendingSessionSaveRef.current = null;
      if (saveSessionTimerRef.current !== null) {
        window.clearTimeout(saveSessionTimerRef.current);
        saveSessionTimerRef.current = null;
      }
    },
    [
      buildChangedSessionDraft,
      lastPersistedSessionRef,
      pendingSessionSaveRef,
      persistSessionSnapshot,
      saveSessionTimerRef,
    ]
  );

  return {
    sessionSummaries: sessions,
    commitCurrentSession,
  };
};
