import {
  readAppStorage,
  subscribeAppStorage,
  writeAppStorage,
} from '@/infrastructure/persistence/storageKeys';
import type { ReasoningLevel } from '@/infrastructure/providers/types';
import type { ProviderId } from '@/shared/types/chat';

export type StoredReasoningPreference = {
  enabled?: boolean;
  level?: ReasoningLevel;
};

type StoredReasoningPreferenceMap = Record<string, StoredReasoningPreference>;

const normalizeReasoningLevel = (value: unknown): ReasoningLevel | undefined => {
  switch (value) {
    case 'low':
    case 'medium':
    case 'high':
    case 'xhigh':
      return value;
    default:
      return undefined;
  }
};

const normalizeStoredReasoningPreference = (value: unknown): StoredReasoningPreference | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const enabled =
    typeof (value as { enabled?: unknown }).enabled === 'boolean'
      ? (value as { enabled: boolean }).enabled
      : undefined;
  const level = normalizeReasoningLevel((value as { level?: unknown }).level);

  if (enabled === undefined && level === undefined) {
    return null;
  }

  return {
    enabled,
    level,
  };
};

const parseStoredReasoningPreferenceMap = (
  value: string | null
): StoredReasoningPreferenceMap | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const entries = Object.entries(parsed)
      .map(([key, storedValue]) => {
        const normalized = normalizeStoredReasoningPreference(storedValue);
        return normalized ? ([key, normalized] as const) : null;
      })
      .filter(Boolean) as Array<readonly [string, StoredReasoningPreference]>;

    return Object.fromEntries(entries);
  } catch {
    return null;
  }
};

const getReasoningStorageEntryKey = (providerId: ProviderId, modelName: string): string => {
  const normalizedModelName = modelName.trim().toLowerCase() || '__default__';
  return `${providerId}:${normalizedModelName}`;
};

export const subscribeReasoningPreferenceStore = (listener: () => void): (() => void) => {
  return subscribeAppStorage('reasoningControl', listener);
};

export const readReasoningPreferenceStoreValue = (): string => {
  return readAppStorage('reasoningControl') ?? '';
};

export const readPersistedReasoningPreference = (
  storedValue: string,
  providerId: ProviderId,
  modelName: string
): StoredReasoningPreference => {
  const storedMap = parseStoredReasoningPreferenceMap(storedValue);
  return storedMap?.[getReasoningStorageEntryKey(providerId, modelName)] ?? {};
};

export const persistReasoningPreference = (
  providerId: ProviderId,
  modelName: string,
  preference: StoredReasoningPreference
): void => {
  const storageKey = getReasoningStorageEntryKey(providerId, modelName);
  const storedMap = parseStoredReasoningPreferenceMap(readReasoningPreferenceStoreValue()) ?? {};
  void writeAppStorage(
    'reasoningControl',
    JSON.stringify({
      ...storedMap,
      [storageKey]: preference,
    })
  );
};
