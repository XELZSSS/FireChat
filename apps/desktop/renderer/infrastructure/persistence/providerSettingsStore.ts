import { ProviderId } from '@/shared/types/chat';
import {
  buildDefaultProviderSettings,
  ProviderSettings,
} from '@/infrastructure/providers/defaults';
import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import { normalizeTavilyConfig } from '@/infrastructure/providers/tavily';
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

type StoredProviderLocalSettings = Partial<
  Pick<ProviderSettings, 'imageModelName' | 'imageGeneration' | 'tavily' | 'openAdapterTools'>
>;

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

    if (normalized.tavily !== undefined) {
      localSettings.tavily = normalized.tavily;
    }

    if (normalized.imageModelName !== undefined) {
      localSettings.imageModelName = normalized.imageModelName;
    }

    if (normalized.imageGeneration !== undefined) {
      localSettings.imageGeneration = normalized.imageGeneration;
    }

    if (normalized.openAdapterTools !== undefined) {
      localSettings.openAdapterTools = normalized.openAdapterTools;
    }

    if (Object.keys(localSettings).length > 0) {
      next[id] = localSettings;
    }
  }

  return next;
};

const resolveGlobalTavilyConfig = (
  settings: Record<ProviderId, ProviderSettings>
): ProviderSettings['tavily'] => {
  for (const id of listProviderIds()) {
    const tavily = normalizeTavilyConfig(settings[id]?.tavily);
    if (tavily) return tavily;
  }
  return undefined;
};

export const applyGlobalTavilyConfig = (
  settings: Record<ProviderId, ProviderSettings>,
  tavily: ProviderSettings['tavily']
): Record<ProviderId, ProviderSettings> => {
  const next = {} as Record<ProviderId, ProviderSettings>;
  for (const id of listProviderIds()) {
    next[id] = { ...settings[id], tavily };
  }
  return next;
};

const applyResolvedGlobalTavily = (
  settings: Record<ProviderId, ProviderSettings>
): Record<ProviderId, ProviderSettings> => {
  return applyGlobalTavilyConfig(settings, resolveGlobalTavilyConfig(settings));
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

  return applyResolvedGlobalTavily(defaults);
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
      imageModelName: entry.imageModelName,
      imageGeneration: entry.imageGeneration,
      tavily: entry.tavily,
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
  const emptyValue = applyResolvedGlobalTavily(defaults);

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
