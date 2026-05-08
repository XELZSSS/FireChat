import { useCallback, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChatService } from '@client/features/chat/application/chatService';
import type { ChatMessage, ChatSession } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import { type SessionContextActions } from '@client/features/sessions/application/session/sessionHelpers';
import { useInitializeSessionState } from '@client/features/sessions/application/session/useInitializeSessionState';
import { useSessionActions } from '@client/features/sessions/application/session/useSessionActions';
import { useSessionDraftPersistence } from '@client/features/sessions/application/session/useSessionDraftPersistence';
import { useSessionPersistence } from '@client/features/sessions/application/session/useSessionPersistence';
import { useSessionSearch } from '@client/features/sessions/application/session/useSessionSearch';
import { useSessionTitleEditing } from '@client/features/sessions/application/session/useSessionTitleEditing';

type UseChatSessionsOptions = {
  chatService: ChatService;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  defaultSessionTitle: string;
  syncConversationState: () => void;
  isStreaming: boolean;
  isLoading: boolean;
  onCloseSidebar?: () => void;
};

export const useChatSessions = ({
  chatService,
  messages,
  setMessages,
  defaultSessionTitle,
  syncConversationState,
  isStreaming,
  isLoading,
  onCloseSidebar,
}: UseChatSessionsOptions) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => uuidv4());
  const [isSessionStateReady, setIsSessionStateReady] = useState(false);
  const latestActivationTokenRef = useRef(0);

  const sessionContextActions = useMemo<SessionContextActions>(
    () => ({
      setCurrentSessionId,
      setMessages,
      syncConversationState,
    }),
    [setMessages, syncConversationState]
  );

  const {
    sessionNotice,
    showSessionNotice,
    clearSessionNotice,
    persistSessionSnapshot,
    scheduleSessionSave,
    discardSessionSave,
    drainSaveQueue,
    lastPersistedSessionRef,
    pendingSessionSaveRef,
    saveSessionTimerRef,
    deletedSessionIdsRef,
  } = useSessionPersistence({ setSessions });

  const {
    editingSessionId,
    editTitleInput,
    setEditTitleInput,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleEditInputClick,
    handleEditKeyDown,
    resetEditState,
  } = useSessionTitleEditing({ setSessions });

  const closeSidebar = useCallback(() => {
    onCloseSidebar?.();
  }, [onCloseSidebar]);

  useInitializeSessionState({
    chatService,
    setSessions,
    setCurrentSessionId,
    setIsSessionStateReady,
    clearSessionNotice,
    showSessionNotice,
    sessionContextActions,
    latestActivationTokenRef,
    lastPersistedSessionRef,
  });

  const currentSession = useMemo(
    () => sessions.find((session) => session.id === currentSessionId),
    [currentSessionId, sessions]
  );

  const { commitCurrentSession, sessionSummaries } = useSessionDraftPersistence({
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
  });

  const { searchQuery, setSearchQuery, filteredSessions } = useSessionSearch({
    sessionSummaries,
  });

  const resetToDraftSession = useCallback(
    (nextSessionId: string) => {
      if (saveSessionTimerRef.current !== null) {
        window.clearTimeout(saveSessionTimerRef.current);
        saveSessionTimerRef.current = null;
      }

      pendingSessionSaveRef.current = null;
      lastPersistedSessionRef.current = null;
      chatService.resetChat();
      chatService.setActiveSessionContext(nextSessionId);
      setMessages([]);
      setCurrentSessionId(nextSessionId);
      setSearchQuery('');
      closeSidebar();
    },
    [
      chatService,
      closeSidebar,
      lastPersistedSessionRef,
      pendingSessionSaveRef,
      saveSessionTimerRef,
      setCurrentSessionId,
      setMessages,
      setSearchQuery,
    ]
  );

  const { activateOrCreateSession, startNewChat, handleLoadSession, handleDeleteSession } =
    useSessionActions({
      chatService,
      currentSessionId,
      editingSessionId,
      isStreaming,
      setSessions,
      resetToDraftSession,
      resetEditState,
      closeSidebar,
      commitCurrentSession,
      discardSessionSave,
      drainSaveQueue,
      clearSessionNotice,
      showSessionNotice,
      sessionContextActions,
      latestActivationTokenRef,
      lastPersistedSessionRef,
      deletedSessionIdsRef,
    });

  const sessionActionsDisabled = isStreaming;
  const sessionActionsDisabledReason = sessionActionsDisabled ? t('sidebar.busyActionHint') : null;

  return {
    activateOrCreateSession,
    sessions: sessionSummaries,
    filteredSessions,
    currentSessionId,
    searchQuery,
    editingSessionId,
    editTitleInput,
    setSearchQuery,
    setEditTitleInput,
    startNewChat,
    handleLoadSession,
    handleDeleteSession,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleEditInputClick,
    handleEditKeyDown,
    isSessionStateReady,
    commitCurrentSession,
    sessionActionsDisabled,
    sessionActionsDisabledReason,
    sessionNotice,
  };
};
