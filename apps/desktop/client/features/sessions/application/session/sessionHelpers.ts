import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { ChatService } from '@client/features/chat/application/chatService';
import { ChatMessage, ChatSession, Role } from '@/shared/types/chat';
import { getMessageText } from '@/shared/utils/chatMessageParts';
import { areComparableValuesEqual } from '@/shared/utils/comparable';

export type SessionContextActions = {
  setCurrentSessionId: Dispatch<SetStateAction<string>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  syncConversationState: () => void;
};

export const SAVE_SESSION_DEBOUNCE_MS = 400;

export const toSessionSummary = (session: ChatSession): ChatSession => ({
  ...session,
  messages: [],
});

const resolveSessionTitle = (
  existingSessionTitle: string | undefined,
  messages: ChatMessage[],
  defaultSessionTitle: string
) => {
  const firstUserMessage = messages.find((message) => message.role === Role.User);
  if (!firstUserMessage) {
    return existingSessionTitle ?? defaultSessionTitle;
  }

  return getMessageText(firstUserMessage).trim();
};

const cloneCliSessionIds = (
  cliSessionIds: ChatSession['cliSessionIds']
): ChatSession['cliSessionIds'] => (cliSessionIds ? { ...cliSessionIds } : undefined);

const areCliSessionIdsEqual = (
  left: ChatSession['cliSessionIds'],
  right: ChatSession['cliSessionIds']
): boolean => areComparableValuesEqual(left ?? {}, right ?? {});

export const buildSessionSnapshot = ({
  currentSessionId,
  existingSessionTitle,
  existingSessionCreatedAt,
  messages,
  defaultSessionTitle,
  providerId,
  modelName,
  cliSessionIds,
  updatedAt,
}: {
  currentSessionId: string;
  existingSessionTitle?: string;
  existingSessionCreatedAt?: number;
  messages: ChatMessage[];
  defaultSessionTitle: string;
  providerId: ChatSession['provider'];
  modelName: string;
  cliSessionIds?: ChatSession['cliSessionIds'];
  updatedAt: number;
}): ChatSession => ({
  id: currentSessionId,
  title: resolveSessionTitle(existingSessionTitle, messages, defaultSessionTitle),
  messages,
  provider: providerId,
  model: modelName,
  cliSessionIds: cloneCliSessionIds(cliSessionIds),
  createdAt: existingSessionCreatedAt ?? Date.now(),
  updatedAt,
});

export const upsertSessionList = (sessions: ChatSession[], session: ChatSession): ChatSession[] => {
  const summary = toSessionSummary(session);
  const next = [summary, ...sessions.filter((item) => item.id !== summary.id)];
  next.sort((a, b) => b.updatedAt - a.updatedAt);
  return next;
};

export const hasSessionSummaryChanged = (
  prev: ChatSession | undefined,
  next: ChatSession
): boolean => {
  if (!prev) return true;
  return (
    prev.title !== next.title ||
    prev.provider !== next.provider ||
    prev.model !== next.model ||
    !areCliSessionIdsEqual(prev.cliSessionIds, next.cliSessionIds) ||
    prev.updatedAt !== next.updatedAt
  );
};

export const hasSessionSnapshotChanged = (
  prev: ChatSession | undefined,
  next: ChatSession
): boolean => {
  if (!prev) return true;
  return (
    prev.title !== next.title ||
    prev.provider !== next.provider ||
    prev.model !== next.model ||
    !areCliSessionIdsEqual(prev.cliSessionIds, next.cliSessionIds) ||
    !areComparableValuesEqual(prev.messages, next.messages)
  );
};

const applySessionContext = async (
  chatService: ChatService,
  session: ChatSession,
  actions: SessionContextActions,
  activationToken: number,
  latestActivationTokenRef: RefObject<number>
): Promise<void> => {
  const { setCurrentSessionId, setMessages, syncConversationState } = actions;
  chatService.setActiveSessionContext(session.id, session.cliSessionIds);
  setCurrentSessionId(session.id);
  setMessages(session.messages);

  if (latestActivationTokenRef.current !== activationToken) return;

  chatService.activateConversationContext({
    providerId: session.provider,
    modelName: session.model,
  });
  syncConversationState();

  if (latestActivationTokenRef.current !== activationToken) return;

  await chatService.restoreChatWithHistory(session.messages);
  if (latestActivationTokenRef.current !== activationToken) return;
  setCurrentSessionId(session.id);
};

export const activateSessionAsync = async (
  chatService: ChatService,
  session: ChatSession,
  actions: SessionContextActions,
  latestActivationTokenRef: RefObject<number>
): Promise<void> => {
  const activationToken = latestActivationTokenRef.current + 1;
  latestActivationTokenRef.current = activationToken;
  await applySessionContext(
    chatService,
    session,
    actions,
    activationToken,
    latestActivationTokenRef
  );
};

export const activateSession = (
  chatService: ChatService,
  session: ChatSession,
  actions: SessionContextActions,
  latestActivationTokenRef: RefObject<number>
): void => {
  const activationToken = latestActivationTokenRef.current + 1;
  latestActivationTokenRef.current = activationToken;
  void applySessionContext(
    chatService,
    session,
    actions,
    activationToken,
    latestActivationTokenRef
  ).catch((error) => {
    if (latestActivationTokenRef.current !== activationToken) return;
    console.error('Failed to sync session history:', error);
  });
};

export const consumePendingSessionSave = (
  saveSessionTimerRef: RefObject<number | null>,
  pendingSessionSaveRef: RefObject<ChatSession | null>
): ChatSession | null => {
  if (saveSessionTimerRef.current !== null) {
    window.clearTimeout(saveSessionTimerRef.current);
    saveSessionTimerRef.current = null;
  }
  const pendingSession = pendingSessionSaveRef.current;
  pendingSessionSaveRef.current = null;
  return pendingSession;
};

export const discardPendingSessionSave = (
  saveSessionTimerRef: RefObject<number | null>,
  pendingSessionSaveRef: RefObject<ChatSession | null>,
  sessionId?: string
): void => {
  if (sessionId && pendingSessionSaveRef.current?.id !== sessionId) return;
  if (saveSessionTimerRef.current !== null) {
    window.clearTimeout(saveSessionTimerRef.current);
    saveSessionTimerRef.current = null;
  }
  pendingSessionSaveRef.current = null;
};
