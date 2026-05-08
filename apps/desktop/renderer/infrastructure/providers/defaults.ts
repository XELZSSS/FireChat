import { ProviderId, TavilyConfig } from '@/shared/types/chat';
import {
  supportsProviderRequestMode,
  supportsProviderTavily,
} from '@/infrastructure/providers/capabilities';
import {
  createDefaultOpenAdapterToolSettings,
  type OpenAdapterToolSettings,
} from '@/infrastructure/providers/openadapterToolConfig';
import type { OpenAIRequestMode } from '@/infrastructure/providers/types';
import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import { getDefaultTavilyConfig } from '@/infrastructure/providers/tavily';
import { getProviderDefaults } from '@/infrastructure/providers/config/providerConfig';
import { getDefaultProviderImageModel } from '@/infrastructure/providers/providerImageCatalog';
import {
  getDefaultImageGenerationSettings,
  type ImageGenerationSettings,
} from '@/infrastructure/providers/imageGenerationSettings';

export interface ProviderSettings {
  apiKey?: string;
  modelName: string;
  systemPrompt?: string;
  imageModelName?: string;
  imageGeneration?: ImageGenerationSettings;
  requestMode?: OpenAIRequestMode;
  baseUrl?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  tavily?: TavilyConfig;
  openAdapterTools?: OpenAdapterToolSettings;
}

export const getDefaultProviderSettings = (providerId: ProviderId): ProviderSettings => {
  const providerDefaults = getProviderDefaults(providerId);

  return {
    apiKey: providerDefaults.defaultApiKey,
    modelName: providerDefaults.defaultModel,
    systemPrompt: providerDefaults.defaultSystemPrompt ?? '',
    imageModelName: getDefaultProviderImageModel(providerId),
    imageGeneration: getDefaultImageGenerationSettings(),
    requestMode: supportsProviderRequestMode(providerId)
      ? (providerDefaults.defaultRequestMode ?? 'chat_completions')
      : undefined,
    baseUrl: providerDefaults.defaultBaseUrl,
    customHeaders: providerDefaults.defaultCustomHeaders ?? [],
    tavily: supportsProviderTavily(providerId) ? getDefaultTavilyConfig() : undefined,
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
