type KeyDefinition = string;
type AppStorageListener = () => void;

const STORAGE_KEYS = {
  activeSessionId: 'activeSessionId',
  activeSessionView: 'activeSessionView',
  providerSettings: 'providerSettings',
  appSettings: 'appSettings',
  searchEnabled: 'searchEnabled',
  reasoningControl: 'reasoningControl',
  inputDraft: 'inputDraft',
  recentEmojis: 'recentEmojis',
  appVersion: 'appVersion',
  updaterStatus: 'updaterStatus',
} as const satisfies Record<string, KeyDefinition>;

const LEGACY_STORAGE_PREFIX = 'firechat_';

export type AppStorageKey = keyof typeof STORAGE_KEYS;

const appStorageListeners = new Map<AppStorageKey, Set<AppStorageListener>>();
const storageCache = new Map<AppStorageKey, string>();
const removedStorageKeys = new Set<AppStorageKey>();

const getStorageBridge = () => {
  const bridge = window.firechat?.storage;
  if (!bridge) {
    throw new Error('SQLite storage bridge is unavailable.');
  }

  return bridge;
};

let didClearLegacyBrowserStorage = false;

const clearLegacyBrowserStorage = (): void => {
  if (didClearLegacyBrowserStorage || typeof window === 'undefined') {
    return;
  }

  didClearLegacyBrowserStorage = true;

  try {
    const storage = window.localStorage;
    const keysToRemove: string[] = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(LEGACY_STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      storage.removeItem(key);
    });
  } catch {
    // Legacy browser storage cleanup is best-effort.
  }
};

clearLegacyBrowserStorage();

const notifyAppStorageListeners = (key: AppStorageKey): void => {
  const listeners = appStorageListeners.get(key);
  if (!listeners) {
    return;
  }

  listeners.forEach((listener) => {
    listener();
  });
};

export const subscribeAppStorage = (
  key: AppStorageKey,
  listener: AppStorageListener
): (() => void) => {
  const listeners = appStorageListeners.get(key) ?? new Set<AppStorageListener>();
  listeners.add(listener);
  appStorageListeners.set(key, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      appStorageListeners.delete(key);
    }
  };
};

export const readAppStorage = (key: AppStorageKey): string | null => {
  if (removedStorageKeys.has(key)) {
    return null;
  }

  const cached = storageCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = getStorageBridge().readAppStorage(STORAGE_KEYS[key]);
  if (value !== null) {
    storageCache.set(key, value);
  }

  return value;
};

export const writeAppStorage = (key: AppStorageKey, value: string): Promise<void> => {
  const previousCachedValue = storageCache.get(key);
  const wasRemoved = removedStorageKeys.has(key);

  try {
    const writePromise = getStorageBridge().writeAppStorage({
      key: STORAGE_KEYS[key],
      value,
    });
    storageCache.set(key, value);
    removedStorageKeys.delete(key);
    notifyAppStorageListeners(key);
    return writePromise.catch((error) => {
      if (previousCachedValue === undefined) {
        storageCache.delete(key);
      } else {
        storageCache.set(key, previousCachedValue);
      }
      if (wasRemoved) {
        removedStorageKeys.add(key);
      }
      notifyAppStorageListeners(key);
      throw error;
    });
  } catch (error) {
    return Promise.reject(error);
  }
};

export const removeAppStorage = (key: AppStorageKey): Promise<void> => {
  const previousCachedValue = storageCache.get(key);
  const wasRemoved = removedStorageKeys.has(key);

  try {
    const removePromise = getStorageBridge().removeAppStorage(STORAGE_KEYS[key]);
    storageCache.delete(key);
    removedStorageKeys.add(key);
    notifyAppStorageListeners(key);
    return removePromise.catch((error) => {
      if (previousCachedValue !== undefined) {
        storageCache.set(key, previousCachedValue);
      }
      if (!wasRemoved) {
        removedStorageKeys.delete(key);
      }
      notifyAppStorageListeners(key);
      throw error;
    });
  } catch (error) {
    return Promise.reject(error);
  }
};
