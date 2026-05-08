import { ChatSession } from '@/shared/types/chat';
import {
  cloneSessions,
  normalizeSession,
} from '@/infrastructure/persistence/sessionStoreSerialization';
import { readMessagePartState } from '@/shared/utils/chatMessageParts';

const getStorageBridge = () => {
  const bridge = window.firechat?.storage;
  if (!bridge) {
    throw new Error('SQLite session storage bridge is unavailable.');
  }

  return bridge;
};

const toSessionSummary = (session: ChatSession): ChatSession =>
  normalizeSession({
    ...session,
    messages: [],
  });

const normalizeSessionList = (sessions: ChatSession[]): ChatSession[] =>
  sessions.map((session) => toSessionSummary(session));

const normalizeFullSession = (session: ChatSession | null): ChatSession | null => {
  return session ? cloneSessions([normalizeSession(session)])[0] : null;
};

export const buildSessionSearchText = (messages: ChatSession['messages']): string => {
  return messages
    .flatMap((message) => {
      const partState = readMessagePartState(message);
      return [partState.text, ...partState.attachments.map((attachment) => attachment.name)];
    })
    .join('\n')
    .toLowerCase();
};

export const getSessionSummaries = async (limit?: number): Promise<ChatSession[]> => {
  return normalizeSessionList(await getStorageBridge().getSessionSummaries(limit));
};

export const getSession = async (sessionId: string): Promise<ChatSession | null> => {
  return normalizeFullSession(await getStorageBridge().getSession(sessionId));
};

export const getActiveSessionId = async (): Promise<string | null> => {
  return getStorageBridge().getActiveSessionId();
};

export const setActiveSessionId = async (sessionId: string): Promise<void> => {
  await getStorageBridge().setActiveSessionId(sessionId);
};

export const clearActiveSessionId = async (): Promise<void> => {
  await getStorageBridge().clearActiveSessionId();
};

export const saveSession = async (session: ChatSession): Promise<void> => {
  const normalized = normalizeSession(session);
  await getStorageBridge().saveSession({
    ...normalized,
    searchText: buildSessionSearchText(normalized.messages),
  });
};

export const updateSessionTitle = async (
  sessionId: string,
  newTitle: string
): Promise<ChatSession[]> => {
  return normalizeSessionList(
    await getStorageBridge().updateSessionTitle({
      sessionId,
      title: newTitle,
    })
  );
};

export const deleteSession = async (sessionId: string): Promise<ChatSession[]> => {
  return normalizeSessionList(await getStorageBridge().deleteSession(sessionId));
};

export const searchSessionSummaries = async (
  query: string,
  limit = 200
): Promise<ChatSession[]> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return getSessionSummaries(limit);
  }

  return normalizeSessionList(
    await getStorageBridge().searchSessionSummaries({
      query: normalizedQuery,
      limit,
    })
  );
};
