import type {
  ProviderConfigEntry,
  ProviderConfigModelEntry,
  ProviderFileSnapshot,
  ProviderTransport,
} from '@contracts/provider-config';
import type { ProviderSettings } from '@/infrastructure/providers/defaults';
import type { ProviderModelItem } from '@/infrastructure/providers/types';
import type { ProviderId } from '@/shared/types/chat';
import { getProviderResolvedConfig } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';

export type CustomProviderDraft = {
  id: string;
  label: string;
  transport: ProviderTransport;
  baseUrl?: string;
  apiKey?: string;
  systemPrompt?: string;
};

const trimText = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const sanitizeProviderId = (value: string): string => value.trim().toLowerCase();

const ensureProviderDoesNotExist = (providerId: string): void => {
  try {
    getProviderResolvedConfig(providerId);
  } catch {
    return;
  }

  throw new Error(`Provider "${providerId}" already exists.`);
};

const toModelRecord = (items: ProviderModelItem[]): Record<string, ProviderConfigModelEntry> => {
  const next: Record<string, ProviderConfigModelEntry> = {};
  for (const item of items) {
    const modelId = item.id.trim();
    if (!modelId) {
      continue;
    }

    next[modelId] = {
      label: item.name.trim() || undefined,
      group: item.group?.trim() || undefined,
      description: item.description?.trim() || undefined,
    };
  }

  return next;
};

const buildConfigOptions = (providerSettings: ProviderSettings) => {
  const baseURL = trimText(providerSettings.baseUrl);
  const requestMode = providerSettings.requestMode;
  const systemPrompt = trimText(providerSettings.systemPrompt);

  if (!baseURL && !requestMode && !systemPrompt) {
    return undefined;
  }

  return {
    ...(baseURL ? { baseURL } : {}),
    ...(requestMode ? { requestMode } : {}),
    ...(systemPrompt ? { systemPrompt } : {}),
  };
};

const buildAuthEntry = (providerSettings: ProviderSettings) => {
  const apiKey = trimText(providerSettings.apiKey);
  const headers = Object.fromEntries(
    (providerSettings.customHeaders ?? []).flatMap((header) => {
      const key = header.key.trim();
      const value = header.value.trim();
      if (!key || !value) {
        return [];
      }
      return [[key, value]];
    })
  );

  if (!apiKey && Object.keys(headers).length === 0) {
    return undefined;
  }

  return {
    ...(apiKey ? { apiKey } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  };
};

export const createCustomProviderSnapshot = (
  snapshot: ProviderFileSnapshot,
  draft: CustomProviderDraft
): ProviderFileSnapshot => {
  const providerId = sanitizeProviderId(draft.id);
  const label = trimText(draft.label) ?? providerId;
  const baseUrl = trimText(draft.baseUrl);
  const apiKey = trimText(draft.apiKey);
  const systemPrompt = trimText(draft.systemPrompt);

  if (!providerId) {
    throw new Error('Provider ID is required.');
  }

  ensureProviderDoesNotExist(providerId);

  if (!baseUrl) {
    throw new Error('Base URL is required.');
  }

  return {
    config: {
      ...snapshot.config,
      providers: {
        ...(snapshot.config.providers ?? {}),
        [providerId]: {
          source: 'custom',
          transport: draft.transport,
          label,
          enabled: true,
          defaultModel: '',
          options:
            baseUrl || systemPrompt
              ? {
                  ...(baseUrl ? { baseURL: baseUrl } : {}),
                  ...(systemPrompt ? { systemPrompt } : {}),
                }
              : undefined,
          models: {},
        },
      },
    },
    auth: {
      ...snapshot.auth,
      providers: {
        ...(snapshot.auth.providers ?? {}),
        [providerId]: apiKey ? { apiKey } : {},
      },
    },
  };
};

export const upsertProviderSnapshot = (
  snapshot: ProviderFileSnapshot,
  providerId: ProviderId,
  providerSettings: ProviderSettings,
  availableModels: ProviderModelItem[]
): ProviderFileSnapshot => {
  const existingConfigEntry = snapshot.config.providers?.[providerId] ?? {};
  const existingAuthEntry = snapshot.auth.providers?.[providerId];
  const runtimeConfig = getProviderResolvedConfig(providerId);
  const nextModels = toModelRecord(availableModels);
  const nextConfigEntry: ProviderConfigEntry = {
    ...existingConfigEntry,
    ...(runtimeConfig.source === 'custom'
      ? {
          source: 'custom',
          transport:
            existingConfigEntry.transport === 'openai' ||
            existingConfigEntry.transport === 'openai-compatible'
              ? existingConfigEntry.transport
              : (runtimeConfig.transport as ProviderTransport),
          label: existingConfigEntry.label?.trim() || runtimeConfig.label,
        }
      : {
          source: 'builtin',
        }),
    enabled: true,
    defaultModel: providerSettings.modelName.trim(),
    options: buildConfigOptions(providerSettings),
    models: nextModels,
  };
  const nextAuthEntry = buildAuthEntry(providerSettings);
  const nextAuthProviders = { ...(snapshot.auth.providers ?? {}) };

  if (nextAuthEntry) {
    nextAuthProviders[providerId] = nextAuthEntry;
  } else if (existingAuthEntry) {
    delete nextAuthProviders[providerId];
  }

  return {
    config: {
      ...snapshot.config,
      providers: {
        ...(snapshot.config.providers ?? {}),
        [providerId]: nextConfigEntry,
      },
    },
    auth: {
      ...snapshot.auth,
      providers: nextAuthProviders,
    },
  };
};

export const upsertProviderImageModelsSnapshot = (
  snapshot: ProviderFileSnapshot,
  providerId: ProviderId,
  imageModels: ProviderModelItem[]
): ProviderFileSnapshot => {
  const existingConfigEntry = snapshot.config.providers?.[providerId] ?? {};

  return {
    ...snapshot,
    config: {
      ...snapshot.config,
      providers: {
        ...(snapshot.config.providers ?? {}),
        [providerId]: {
          ...existingConfigEntry,
          source: existingConfigEntry.source ?? 'builtin',
          imageModels: toModelRecord(imageModels),
        },
      },
    },
  };
};

export const removeProviderSnapshotEntry = (
  snapshot: ProviderFileSnapshot,
  providerId: ProviderId
): ProviderFileSnapshot => {
  const nextConfigProviders = { ...(snapshot.config.providers ?? {}) };
  const nextAuthProviders = { ...(snapshot.auth.providers ?? {}) };
  delete nextConfigProviders[providerId];
  delete nextAuthProviders[providerId];

  return {
    config: {
      ...snapshot.config,
      providers: nextConfigProviders,
    },
    auth: {
      ...snapshot.auth,
      providers: nextAuthProviders,
    },
  };
};
