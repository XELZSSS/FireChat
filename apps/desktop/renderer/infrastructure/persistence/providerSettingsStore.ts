import { ProviderId } from '@/shared/types/chat';
import {
  buildDefaultProviderSettings,
  ProviderSettings,
} from '@/infrastructure/providers/defaults';
import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import {
  isPlainObject,
  loadJsonBackedStore,
  persistJsonBackedStore,
} from '@/infrastructure/persistence/jsonBackedStore';
import {
  canonicalizeStoredProviderSettings,
  normalizeProviderSettingsUpdateAgainstBase,
} from '@/infrastructure/persistence/providerSettingsCodec';
import {
  loadDefaultProviderId as loadAppDefaultProviderId,
  persistDefaultProviderId as persistAppDefaultProviderId,
} from '@/infrastructure/persistence/appSettingsStore';
import { areComparableValuesEqual } from '@/shared/utils/comparable';

type StoredProviderLocalSettings = Partial<Pick<ProviderSettings, 'openAdapterTools'>>;

const normalizeStoredProviderLocalSettingsRecord = (
  value: unknown
): Partial<Record<ProviderId, StoredProviderLocalSettings>> => {
  const defaults = buildDefaultProviderSettings();
  const storedSettings = toStoredProviderSettingsRecord(value);
  const next: Partial<Record<ProviderId, StoredProviderLocalSettings>> = {};

  for (const id of listProviderIds()) {
    if (!Object.prototype.hasOwnProperty.call(storedSettings, id)) {
      continue;
    }

    const normalized = canonicalizeStoredProviderSettings(
      id,
      defaults[id],
      storedSettings[id] ?? {}
    );
    const localSettings: StoredProviderLocalSettings = {};

    if (normalized.openAdapterTools !== undefined) {
      localSettings.openAdapterTools = normalized.openAdapterTools;
    }

    if (Object.keys(localSettings).length > 0) {
      next[id] = localSettings;
    }
  }

  return next;
};

const toStoredProviderSettingsRecord = (
  value: unknown
): Partial<Record<string, StoredProviderLocalSettings>> => {
  return isPlainObject(value)
    ? (value as Partial<Record<string, StoredProviderLocalSettings>>)
    : {};
};

const canonicalizeProviderSettingsRecord = (
  value: unknown
): Record<ProviderId, ProviderSettings> => {
  const defaults = buildDefaultProviderSettings();
  const storedSettings = toStoredProviderSettingsRecord(value);

  for (const id of listProviderIds()) {
    defaults[id] = normalizeStoredProviderSettings(id, defaults[id], storedSettings[id] ?? {});
  }

  return defaults;
};

export const normalizeProviderSettingsRecord = (
  value: unknown
): Record<ProviderId, ProviderSettings> => {
  return canonicalizeProviderSettingsRecord(value);
};

const normalizeStoredProviderSettings = (
  providerId: ProviderId,
  defaults: ProviderSettings,
  storedSettings: StoredProviderLocalSettings
): ProviderSettings => {
  return canonicalizeStoredProviderSettings(providerId, defaults, storedSettings);
};

const toPersistableProviderSettingsRecord = (
  settings: Record<ProviderId, ProviderSettings>
): Partial<Record<ProviderId, StoredProviderLocalSettings>> => {
  const next: Partial<Record<ProviderId, StoredProviderLocalSettings>> = {};

  for (const id of listProviderIds()) {
    const entry = settings[id];
    if (!entry) {
      continue;
    }

    next[id] = {
      openAdapterTools: entry.openAdapterTools,
    };
  }

  return next;
};

export const loadDefaultProviderId = (): ProviderId => {
  return loadAppDefaultProviderId();
};

export const persistDefaultProviderId = (providerId: ProviderId): void => {
  persistAppDefaultProviderId(providerId);
};

export const loadProviderSettings = (): Record<ProviderId, ProviderSettings> => {
  const defaults = buildDefaultProviderSettings();
  const emptyValue = defaults;

  return loadJsonBackedStore({
    storageKey: 'providerSettings',
    emptyValue,
    normalize: canonicalizeProviderSettingsRecord,
    shouldPersist: (parsed, normalizedSettings) =>
      !areComparableValuesEqual(
        normalizeStoredProviderLocalSettingsRecord(parsed),
        toPersistableProviderSettingsRecord(normalizedSettings)
      ),
    persist: persistProviderSettings,
    errorLabel: 'Failed to load provider settings:',
  });
};

export const persistProviderSettings = (settings: Record<ProviderId, ProviderSettings>): void => {
  void persistJsonBackedStore({
    storageKey: 'providerSettings',
    value: toPersistableProviderSettingsRecord(settings),
    normalize: normalizeStoredProviderLocalSettingsRecord,
    errorLabel: 'Failed to persist provider settings:',
  });
};

export const normalizeProviderSettingsUpdate = (
  providerId: ProviderId,
  current: ProviderSettings,
  updates: Partial<ProviderSettings>
): ProviderSettings => {
  return normalizeProviderSettingsUpdateAgainstBase(providerId, current, updates);
};
