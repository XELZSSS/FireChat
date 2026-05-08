import {
  readAppStorage,
  removeAppStorage,
  writeAppStorage,
} from '@/infrastructure/persistence/storageKeys';

export type ActiveSessionViewState =
  | {
      kind: 'draft';
      sessionId: string;
    }
  | {
      kind: 'session';
      sessionId: string;
    };

const isViewKind = (value: unknown): value is ActiveSessionViewState['kind'] =>
  value === 'draft' || value === 'session';

const normalizeSessionId = (value: unknown): string | null => {
  const sessionId = typeof value === 'string' ? value.trim() : '';
  return sessionId.length > 0 ? sessionId : null;
};

const parseActiveSessionViewState = (raw: string | null): ActiveSessionViewState | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { kind?: unknown; sessionId?: unknown };
    const sessionId = normalizeSessionId(parsed.sessionId);
    if (!isViewKind(parsed.kind) || !sessionId) {
      return null;
    }

    return {
      kind: parsed.kind,
      sessionId,
    };
  } catch {
    return null;
  }
};

const writeActiveSessionViewState = (state: ActiveSessionViewState): void => {
  writeAppStorage('activeSessionView', JSON.stringify(state));
};

export const readActiveSessionViewState = (): ActiveSessionViewState | null =>
  parseActiveSessionViewState(readAppStorage('activeSessionView'));

export const writeDraftSessionViewState = (sessionId: string): void => {
  const normalizedSessionId = normalizeSessionId(sessionId);
  if (!normalizedSessionId) {
    removeAppStorage('activeSessionView');
    return;
  }

  writeActiveSessionViewState({
    kind: 'draft',
    sessionId: normalizedSessionId,
  });
};

export const writePersistedSessionViewState = (sessionId: string): void => {
  const normalizedSessionId = normalizeSessionId(sessionId);
  if (!normalizedSessionId) {
    removeAppStorage('activeSessionView');
    return;
  }

  writeActiveSessionViewState({
    kind: 'session',
    sessionId: normalizedSessionId,
  });
};

export const clearActiveSessionViewState = (): void => {
  removeAppStorage('activeSessionView');
};
