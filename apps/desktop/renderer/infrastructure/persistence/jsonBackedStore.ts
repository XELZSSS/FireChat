import { readAppStorage, writeAppStorage } from '@/infrastructure/persistence/storageKeys';
import type { AppStorageKey } from '@/infrastructure/persistence/storageKeys';

export const canUseAppStorage = (): boolean => typeof window !== 'undefined';
export { isPlainObject } from '@/shared/utils/plainObject';

type LoadJsonBackedStoreOptions<T> = {
  storageKey: AppStorageKey;
  emptyValue: T;
  normalize: (value: unknown) => T;
  shouldPersist?: (parsed: unknown, normalized: T) => boolean;
  persist: (value: T) => unknown;
  errorLabel: string;
};

export const loadJsonBackedStore = <T>({
  storageKey,
  emptyValue,
  normalize,
  shouldPersist,
  persist,
  errorLabel,
}: LoadJsonBackedStoreOptions<T>): T => {
  if (!canUseAppStorage()) {
    return emptyValue;
  }

  try {
    const stored = readAppStorage(storageKey);
    if (!stored) {
      return emptyValue;
    }

    const parsed = JSON.parse(stored) as unknown;
    const normalized = normalize(parsed);
    if (shouldPersist?.(parsed, normalized)) {
      persist(normalized);
    }
    return normalized;
  } catch (error) {
    console.error(errorLabel, error);
    return emptyValue;
  }
};

type PersistJsonBackedStoreOptions<T> = {
  storageKey: AppStorageKey;
  value: T;
  normalize: (value: T) => T;
  errorLabel: string;
};

export const persistJsonBackedStore = <T>({
  storageKey,
  value,
  normalize,
  errorLabel,
}: PersistJsonBackedStoreOptions<T>): T => {
  const normalized = normalize(value);
  if (!canUseAppStorage()) {
    return normalized;
  }

  try {
    void writeAppStorage(storageKey, JSON.stringify(normalized));
  } catch (error) {
    console.error(errorLabel, error);
  }

  return normalized;
};

export const persistJsonBackedStoreAsync = async <T>({
  storageKey,
  value,
  normalize,
  errorLabel,
}: PersistJsonBackedStoreOptions<T>): Promise<T> => {
  const normalized = normalize(value);
  if (!canUseAppStorage()) {
    return normalized;
  }

  try {
    await writeAppStorage(storageKey, JSON.stringify(normalized));
  } catch (error) {
    console.error(errorLabel, error);
  }

  return normalized;
};
