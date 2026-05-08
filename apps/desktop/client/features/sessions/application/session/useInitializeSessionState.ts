import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { ChatService } from '@client/features/chat/application/chatService';
import type { ChatSession } from '@/shared/types/chat';
import {
  clearActiveSessionId,
  deleteSession,
  getActiveSessionId,
  getSession,
  getSessionSummaries,
  setActiveSessionId,
} from '@/infrastructure/persistence/sessionStore';
import {
  clearActiveSessionViewState,
  readActiveSessionViewState,
  writeDraftSessionViewState,
  writePersistedSessionViewState,
} from '@/infrastructure/persistence/activeSessionViewState';
import { t } from '@/shared/utils/i18n';
import {
  activateSession,
  type SessionContextActions,
} from '@client/features/sessions/application/session/sessionHelpers';

type UseInitializeSessionStateOptions = {
  chatService: ChatService;
  setSessions: Dispatch<SetStateAction<ChatSession[]>>;
  setCurrentSessionId: Dispatch<SetStateAction<string>>;
  setIsSessionStateReady: Dispatch<SetStateAction<boolean>>;
  clearSessionNotice: () => void;
  showSessionNotice: (message: string) => void;
  sessionContextActions: SessionContextActions;
  latestActivationTokenRef: RefObject<number>;
  lastPersistedSessionRef: RefObject<ChatSession | null>;
};

export const useInitializeSessionState = ({
  chatService,
  setSessions,
  setCurrentSessionId,
  setIsSessionStateReady,
  clearSessionNotice,
  showSessionNotice,
  sessionContextActions,
  latestActivationTokenRef,
  lastPersistedSessionRef,
}: UseInitializeSessionStateOptions) => {
  useEffect(() => {
    let disposed = false;

    const loadSessionState = async () => {
      try {
        let loadedSessions = await getSessionSummaries(200);
        const activeId = await getActiveSessionId();
        const activeSessionView = readActiveSessionViewState();
        if (disposed) {
          return;
        }

        setSessions(loadedSessions);

        const matchedActiveSessionSummary = activeId
          ? loadedSessions.find((session) => session.id === activeId)
          : undefined;
        const shouldRestoreDraftSession =
          !!activeId &&
          activeSessionView?.kind === 'draft' &&
          activeSessionView.sessionId === activeId &&
          !matchedActiveSessionSummary;
        let activeSessionSummary =
          matchedActiveSessionSummary ??
          (shouldRestoreDraftSession ? undefined : loadedSessions[0]);

        if (shouldRestoreDraftSession && activeId) {
          chatService.activateDefaultConversationContext();
          chatService.setActiveSessionContext(activeId);
          lastPersistedSessionRef.current = null;
          sessionContextActions.setMessages([]);
          sessionContextActions.syncConversationState();
          setCurrentSessionId(activeId);
          if (!disposed) {
            clearSessionNotice();
            setIsSessionStateReady(true);
          }
          return;
        }

        while (activeSessionSummary) {
          const activeSession = await getSession(activeSessionSummary.id);
          if (disposed) {
            return;
          }

          if (activeSession) {
            if (activeId !== activeSession.id) {
              await setActiveSessionId(activeSession.id);
              if (disposed) {
                return;
              }
            }

            writePersistedSessionViewState(activeSession.id);
            lastPersistedSessionRef.current = activeSession;
            activateSession(
              chatService,
              activeSession,
              sessionContextActions,
              latestActivationTokenRef
            );
            if (!disposed) {
              clearSessionNotice();
              setIsSessionStateReady(true);
            }
            return;
          }

          const missingSessionId = activeSessionSummary.id;

          void deleteSession(missingSessionId).catch((error) => {
            console.error(`Failed to clean up missing session "${missingSessionId}":`, error);
          });

          if (activeId === missingSessionId) {
            await clearActiveSessionId();
            clearActiveSessionViewState();
          }

          loadedSessions = loadedSessions.filter((session) => session.id !== missingSessionId);
          setSessions(loadedSessions);
          activeSessionSummary = loadedSessions[0];
        }

        const newId = uuidv4();
        chatService.activateDefaultConversationContext();
        chatService.setActiveSessionContext(newId);
        sessionContextActions.syncConversationState();
        setCurrentSessionId(newId);
        await setActiveSessionId(newId);
        writeDraftSessionViewState(newId);
        if (!disposed) {
          clearSessionNotice();
          setIsSessionStateReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize session state:', error);
        if (!disposed) {
          showSessionNotice(t('session.error.init'));
          setIsSessionStateReady(true);
        }
      }
    };

    void loadSessionState();

    return () => {
      disposed = true;
    };
  }, [
    chatService,
    clearSessionNotice,
    lastPersistedSessionRef,
    latestActivationTokenRef,
    sessionContextActions,
    setCurrentSessionId,
    setIsSessionStateReady,
    setSessions,
    showSessionNotice,
  ]);
};
