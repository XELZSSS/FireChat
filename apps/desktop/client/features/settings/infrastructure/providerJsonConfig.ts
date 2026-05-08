import type {
  ProviderAuthEntry,
  ProviderConfigEntry,
  ProviderFileSnapshot,
  ProviderTransport,
} from '@contracts/provider-config';
import type { ProviderId } from '@/shared/types/chat';
import type { ProviderSettings } from '@/infrastructure/providers/defaults';
import type { ProviderModelItem } from '@/infrastructure/providers/types';
import { createDefaultOpenAdapterToolSettings } from '@/infrastructure/providers/openadapterToolConfig';
import { normalizeImageGenerationSettings } from '@/infrastructure/providers/imageGenerationSettings';
import { upsertProviderSnapshot } from '@/infrastructure/providers/runtime/providerFileMutations';
import { getCurrentProviderFileSnapshot } from '@/infrastructure/providers/runtime/providerRuntimeSync';
import {
  buildHeadersRecord,
  normalizeHeaderEntries,
  normalizeProviderJsonId,
  normalizeRequestMode,
  trimText,
} from '@client/features/settings/infrastructure/providerJsonConfigHelpers';

export type ProviderJsonConfig = {
  providerId: string;
  imageModelName?: string;
  imageGeneration?: Partial<ProviderSettings['imageGeneration']>;
  config: ProviderConfigEntry;
  auth: ProviderAuthEntry;
};

const buildProviderJsonConfig = (
  providerId: string,
  config: ProviderConfigEntry | undefined,
  auth: ProviderAuthEntry | undefined,
  providerSettings: Partial<ProviderSettings> | undefined
): ProviderJsonConfig => {
  const defaultModel = trimText(providerSettings?.modelName) ?? config?.defaultModel ?? '';
  const baseURL = trimText(providerSettings?.baseUrl) ?? config?.options?.baseURL;
  const requestMode =
    normalizeRequestMode(providerSettings?.requestMode) ?? config?.options?.requestMode;
  const systemPrompt = trimText(providerSettings?.systemPrompt) ?? config?.options?.systemPrompt;
  const apiKey = trimText(providerSettings?.apiKey) ?? trimText(auth?.apiKey) ?? '';
  const headers = {
    ...(auth?.headers ?? {}),
    ...buildHeadersRecord(providerSettings?.customHeaders),
  };

  return {
    providerId,
    ...(trimText(providerSettings?.imageModelName)
      ? { imageModelName: trimText(providerSettings?.imageModelName) }
      : {}),
    ...(providerSettings?.imageGeneration
      ? { imageGeneration: providerSettings.imageGeneration }
      : {}),
    config: {
      ...config,
      defaultModel,
      options:
        baseURL || requestMode || systemPrompt
          ? {
              ...(config?.options ?? {}),
              ...(baseURL ? { baseURL } : {}),
              ...(requestMode ? { requestMode } : {}),
              ...(systemPrompt ? { systemPrompt } : {}),
            }
          : config?.options,
    },
    auth: {
      ...(apiKey ? { apiKey } : {}),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    },
  };
};

const mergeProviderConfigOptions = (
  parsedOptions: ProviderConfigEntry['options'],
  fieldOptions: ProviderConfigEntry['options']
): ProviderConfigEntry['options'] => {
  if (!parsedOptions && !fieldOptions) {
    return undefined;
  }

  const { systemPrompt: _parsedSystemPrompt, ...parsedOptionsWithoutSystemPrompt } =
    parsedOptions ?? {};

  return {
    ...parsedOptionsWithoutSystemPrompt,
    ...(fieldOptions ?? {}),
    ...(fieldOptions?.systemPrompt ? { systemPrompt: fieldOptions.systemPrompt } : {}),
  };
};

export const buildProviderJsonText = (
  providerId: ProviderId,
  providerSettings?: Partial<ProviderSettings>,
  snapshot: ProviderFileSnapshot = getCurrentProviderFileSnapshot()
): string => {
  return `${JSON.stringify(
    buildProviderJsonConfig(
      providerId,
      snapshot.config.providers?.[providerId],
      snapshot.auth.providers?.[providerId],
      providerSettings
    ),
    null,
    2
  )}\n`;
};

export const buildCustomProviderJsonTemplate = (): string => {
  return `${JSON.stringify(
    {
      providerId: 'custom-provider',
      config: {
        source: 'custom',
        transport: 'openai-compatible',
        label: 'Custom Provider',
        enabled: true,
        defaultModel: '',
        options: {
          baseURL: 'https://api.example.com/v1',
          requestMode: 'chat_completions',
        },
        models: {},
      },
      auth: {
        apiKey: '',
        headers: {},
      },
    },
    null,
    2
  )}\n`;
};

export const parseProviderJsonText = (value: string): ProviderJsonConfig => {
  const parsed = JSON.parse(value) as Partial<ProviderJsonConfig>;
  const providerId = normalizeProviderJsonId(String(parsed.providerId ?? ''));

  if (!providerId) {
    throw new Error('Provider ID is required');
  }

  const config =
    parsed.config && typeof parsed.config === 'object' && !Array.isArray(parsed.config)
      ? parsed.config
      : {};
  const auth =
    parsed.auth && typeof parsed.auth === 'object' && !Array.isArray(parsed.auth)
      ? parsed.auth
      : {};

  return {
    providerId,
    imageModelName: trimText(parsed.imageModelName),
    imageGeneration:
      parsed.imageGeneration && typeof parsed.imageGeneration === 'object'
        ? parsed.imageGeneration
        : undefined,
    config: config as ProviderConfigEntry,
    auth: auth as ProviderAuthEntry,
  };
};

export const applyProviderJsonToSettings = (
  providerJson: ProviderJsonConfig
): Partial<ProviderSettings> => {
  const options = providerJson.config.options ?? {};

  return {
    modelName: trimText(providerJson.config.defaultModel) ?? '',
    systemPrompt: trimText(options.systemPrompt) ?? '',
    imageModelName: trimText(providerJson.imageModelName) ?? '',
    imageGeneration: providerJson.imageGeneration
      ? normalizeImageGenerationSettings(providerJson.imageGeneration)
      : undefined,
    apiKey: trimText(providerJson.auth.apiKey) ?? '',
    requestMode: normalizeRequestMode(options.requestMode),
    baseUrl: trimText(options.baseURL),
    customHeaders: normalizeHeaderEntries(providerJson.auth.headers),
    openAdapterTools: createDefaultOpenAdapterToolSettings(),
  };
};

export const createCustomProviderDraftFromJson = (providerJson: ProviderJsonConfig) => {
  const transport = providerJson.config.transport;
  const baseUrl = trimText(providerJson.config.options?.baseURL);

  if (transport !== 'openai' && transport !== 'openai-compatible') {
    throw new Error('Custom provider transport is invalid');
  }

  if (!baseUrl) {
    throw new Error('Custom provider base URL is required');
  }

  return {
    id: providerJson.providerId,
    label: trimText(providerJson.config.label) ?? providerJson.providerId,
    transport: transport as ProviderTransport,
    baseUrl,
    apiKey: trimText(providerJson.auth.apiKey),
    systemPrompt: trimText(providerJson.config.options?.systemPrompt),
  };
};

export const buildProviderSnapshotFromJsonText = ({
  snapshot,
  providerId,
  providerSettings,
  availableModels,
  providerJsonText,
}: {
  snapshot: ProviderFileSnapshot;
  providerId: ProviderId;
  providerSettings: ProviderSettings;
  availableModels: ProviderModelItem[];
  providerJsonText: string;
}): ProviderFileSnapshot => {
  const fieldSnapshot = upsertProviderSnapshot(
    snapshot,
    providerId,
    providerSettings,
    availableModels
  );
  const parsed = parseProviderJsonText(providerJsonText);
  const fieldConfig = fieldSnapshot.config.providers?.[providerId] ?? {};
  const fieldAuth = fieldSnapshot.auth.providers?.[providerId] ?? {};
  const parsedConfig = parsed.config ?? {};
  const parsedAuth = parsed.auth ?? {};
  const mergedHeaders = {
    ...(parsedAuth.headers ?? {}),
    ...(fieldAuth.headers ?? {}),
  };
  const nextConfig: ProviderConfigEntry = {
    ...parsedConfig,
    source: parsedConfig.source ?? fieldConfig.source,
    transport: parsedConfig.transport ?? fieldConfig.transport,
    enabled: typeof parsedConfig.enabled === 'boolean' ? parsedConfig.enabled : fieldConfig.enabled,
    label: parsedConfig.label ?? fieldConfig.label,
    icon: parsedConfig.icon ?? fieldConfig.icon,
    defaultModel: fieldConfig.defaultModel,
    options: mergeProviderConfigOptions(parsedConfig.options, fieldConfig.options),
    models:
      parsedConfig.models || fieldConfig.models
        ? {
            ...(parsedConfig.models ?? {}),
            ...(fieldConfig.models ?? {}),
          }
        : undefined,
    imageModels:
      parsedConfig.imageModels || fieldConfig.imageModels
        ? {
            ...(parsedConfig.imageModels ?? {}),
            ...(fieldConfig.imageModels ?? {}),
          }
        : undefined,
  };

  const nextAuth: ProviderAuthEntry = {
    ...(trimText(fieldAuth.apiKey) ? { apiKey: fieldAuth.apiKey } : {}),
    ...(Object.keys(mergedHeaders).length > 0 ? { headers: mergedHeaders } : {}),
  };
  const nextAuthProviders = { ...(fieldSnapshot.auth.providers ?? {}) };
  if (trimText(nextAuth.apiKey) || Object.keys(nextAuth.headers ?? {}).length > 0) {
    nextAuthProviders[providerId] = nextAuth;
  } else {
    delete nextAuthProviders[providerId];
  }

  return {
    config: {
      ...fieldSnapshot.config,
      providers: {
        ...(fieldSnapshot.config.providers ?? {}),
        [providerId]: nextConfig,
      },
    },
    auth: {
      ...fieldSnapshot.auth,
      providers: nextAuthProviders,
    },
  };
};
