import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { ChatService } from '@client/features/chat/application/chatService';
import type { ChatSession } from '@/shared/types/chat';
import {
  deleteSession,
  getSession,
  getSessionSummaries,
  setActiveSessionId,
} from '@/infrastructure/persistence/sessionStore';
import {
  writeDraftSessionViewState,
  writePersistedSessionViewState,
} from '@/infrastructure/persistence/activeSessionViewState';
import { t } from '@/shared/utils/i18n';
import {
  activateSession,
  activateSessionAsync,
  type SessionContextActions,
} from '@client/features/sessions/application/session/sessionHelpers';


type UseSessionActionsOptions = {
  chatService: ChatService;
  currentSessionId: string;
  editingSessionId: string | null;
  isStreaming: boolean;
  setSessions: Dispatch<SetStateAction<ChatSession[]>>;
  resetToDraftSession: (nextSessionId: string) => void;
  resetEditState: () => void;
  closeSidebar: () => void;
  commitCurrentSession: (options?: { force?: boolean }) => Promise<void>;
  discardSessionSave: (sessionId?: string) => void;
  drainSaveQueue: () => Promise<void>;
  clearSessionNotice: () => void;
  showSessionNotice: (message: string) => void;
  sessionContextActions: SessionContextActions;
  latestActivationTokenRef: RefObject<number>;
  lastPersistedSessionRef: RefObject<ChatSession | null>;
  deletedSessionIdsRef: RefObject<Set<string>>;
};

export const useSessionActions = ({
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
}: UseSessionActionsOptions) => {
  const activateDraftSession = useCallback(
    async (sessionId: string) => {
      await commitCurrentSession({ force: true });
      chatService.activateDefaultConversationContext();
      sessionContextActions.syncConversationState();
      resetToDraftSession(sessionId);
      await setActiveSessionId(sessionId);
      writeDraftSessionViewState(sessionId);
      clearSessionNotice();
    },
    [
      chatService,
      clearSessionNotice,
      commitCurrentSession,
      resetToDraftSession,
      sessionContextActions,
    ]
  );

  const activatePersistedSession = useCallback(
    async (session: ChatSession, asyncRestore = false) => {
      lastPersistedSessionRef.current = session;
      await setActiveSessionId(session.id);
      writePersistedSessionViewState(session.id);
      if (asyncRestore) {
        await activateSessionAsync(
          chatService,
          session,
          sessionContextActions,
          latestActivationTokenRef
        );
      } else {
        activateSession(chatService, session, sessionContextActions, latestActivationTokenRef);
      }
      clearSessionNotice();
      closeSidebar();
    },
    [
      chatService,
      clearSessionNotice,
      closeSidebar,
      lastPersistedSessionRef,
      latestActivationTokenRef,
      sessionContextActions,
    ]
  );

  const activateOrCreateSession = useCallback(
    async (sessionId: string) => {
      const targetSessionId = String(sessionId ?? '').trim();
      if (!targetSessionId) {
        throw new Error('sessionId is required');
      }

      const loadedSession = await getSession(targetSessionId);
      if (!loadedSession) {
        await activateDraftSession(targetSessionId);
        return;
      }

      await activatePersistedSession(loadedSession, true);
    },
    [activateDraftSession, activatePersistedSession]
  );

  const startNewChat = useCallback(() => {
    void activateDraftSession(uuidv4()).catch((error) => {
      console.error('Failed to start a new chat session:', error);
      showSessionNotice(t('session.error.init'));
    });
  }, [activateDraftSession, showSessionNotice]);

  const handleLoadSession = useCallback(
    (session: ChatSession) => {
      if (isStreaming) return;
      if (editingSessionId === session.id) return;

      if (session.id === currentSessionId) {
        closeSidebar();
        return;
      }

      void commitCurrentSession({ force: true })
        .then(() => getSession(session.id))
        .then(async (loadedSession) => {
          if (!loadedSession) {
            setSessions(await getSessionSummaries(200));
            showSessionNotice(t('session.error.missing'));
            return;
          }

          await activatePersistedSession(loadedSession);
        })
        .catch((error) => {
          console.error(`Failed to load session "${session.id}":`, error);
          showSessionNotice(t('session.error.load'));
        });
    },
    [
      activatePersistedSession,
      closeSidebar,
      currentSessionId,
      editingSessionId,
      commitCurrentSession,
      isStreaming,
      setSessions,
      showSessionNotice,
    ]
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      if (editingSessionId === sessionId) {
        resetEditState();
      }

      discardSessionSave(sessionId);
      deletedSessionIdsRef.current.add(sessionId);

      void commitCurrentSession({ force: true })
        .then(() => drainSaveQueue())
        .then(() => deleteSession(sessionId))
        .then(async (updatedSessions) => {
          setSessions(updatedSessions);

          if (sessionId === currentSessionId) {
            await activateDraftSession(uuidv4());
            clearSessionNotice();
            return;
          }

          clearSessionNotice();
        })
        .catch((error) => {
          deletedSessionIdsRef.current.delete(sessionId);
          console.error(`Failed to delete session "${sessionId}":`, error);
          showSessionNotice(t('session.error.delete'));
        });
    },
    [
      activateDraftSession,
      chatService,
      clearSessionNotice,
      currentSessionId,
      deletedSessionIdsRef,
      commitCurrentSession,
      discardSessionSave,
      drainSaveQueue,
      editingSessionId,
      resetEditState,
      setSessions,
      showSessionNotice,
    ]
  );

  return {
    activateOrCreateSession,
    startNewChat,
    handleLoadSession,
    handleDeleteSession,
  };
};
