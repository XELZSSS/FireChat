import { ProviderId } from '@/shared/types/chat';
import { supportsProviderRequestMode } from '@/infrastructure/providers/capabilities';
import {
  createDefaultOpenAdapterToolSettings,
  type OpenAdapterToolSettings,
} from '@/infrastructure/providers/openadapterToolConfig';
import type { OpenAIRequestMode } from '@/infrastructure/providers/types';
import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import { getProviderDefaults } from '@/infrastructure/providers/config/providerConfig';

export interface ProviderSettings {
  apiKey?: string;
  modelName: string;
  systemPrompt?: string;
  requestMode?: OpenAIRequestMode;
  baseUrl?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  openAdapterTools?: OpenAdapterToolSettings;
}

export const getDefaultProviderSettings = (providerId: ProviderId): ProviderSettings => {
  const providerDefaults = getProviderDefaults(providerId);

  return {
    apiKey: providerDefaults.defaultApiKey,
    modelName: providerDefaults.defaultModel,
    systemPrompt: providerDefaults.defaultSystemPrompt ?? '',
    requestMode: supportsProviderRequestMode(providerId)
      ? (providerDefaults.defaultRequestMode ?? 'chat_completions')
      : undefined,
    baseUrl: providerDefaults.defaultBaseUrl,
    customHeaders: providerDefaults.defaultCustomHeaders ?? [],
    openAdapterTools:
      providerId === 'openadapter' ? createDefaultOpenAdapterToolSettings() : undefined,
  };
};

export const buildDefaultProviderSettings = (): Record<ProviderId, ProviderSettings> => {
  const defaults = {} as Record<ProviderId, ProviderSettings>;
  for (const id of listProviderIds()) {
    defaults[id] = getDefaultProviderSettings(id);
  }
  return defaults;
};
