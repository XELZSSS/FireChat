import { useCallback, useSyncExternalStore } from 'react';
import type { SetStateAction } from 'react';
import {
  readAppStorage,
  subscribeAppStorage,
  writeAppStorage,
} from '@/infrastructure/persistence/storageKeys';
import type { AppStorageKey } from '@/infrastructure/persistence/storageKeys';

type ProviderToggleMap = Record<string, boolean>;

type UseProviderTogglePreferenceOptions = {
  storageKey: AppStorageKey;
  currentProviderId: string;
  defaultValue: boolean;
};

const parseStoredToggleMap = (value: string | null): ProviderToggleMap | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, boolean] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'boolean'
      )
    );
  } catch {
    return null;
  }
};

const readPersistedProviderToggle = (
  storageKey: AppStorageKey,
  providerId: string,
  defaultValue: boolean
): boolean => {
  const stored = readAppStorage(storageKey);
  const toggleMap = parseStoredToggleMap(stored);
  return toggleMap?.[providerId] ?? defaultValue;
};

const persistProviderToggle = (
  storageKey: AppStorageKey,
  providerId: string,
  enabled: boolean
): void => {
  const toggleMap = parseStoredToggleMap(readAppStorage(storageKey)) ?? {};
  writeAppStorage(storageKey, JSON.stringify({ ...toggleMap, [providerId]: enabled }));
};

export const useProviderTogglePreference = ({
  storageKey,
  currentProviderId,
  defaultValue,
}: UseProviderTogglePreferenceOptions) => {
  const subscribe = useCallback(
    (listener: () => void) => subscribeAppStorage(storageKey, listener),
    [storageKey]
  );

  const enabled = useSyncExternalStore(
    subscribe,
    () => readPersistedProviderToggle(storageKey, currentProviderId, defaultValue),
    () => defaultValue
  );

  const setEnabled = useCallback(
    (value: SetStateAction<boolean>) => {
      const next = typeof value === 'function' ? value(enabled) : value;
      persistProviderToggle(storageKey, currentProviderId, next);
    },
    [currentProviderId, enabled, storageKey]
  );

  return { enabled, setEnabled };
};
