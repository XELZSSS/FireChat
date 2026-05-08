import { ProviderId } from '@/shared/types/chat';
import type { ProviderSettings } from '@/infrastructure/providers/defaults';
import { normalizeBaseUrlForProvider } from '@/infrastructure/providers/config/baseUrl';
import { supportsProviderRequestMode } from '@/infrastructure/providers/capabilities';
import { normalizeCustomHeaders as normalizeHeaders } from '@/infrastructure/providers/headerUtils';
import { normalizeOpenAdapterToolSettings } from '@/infrastructure/providers/openadapterToolConfig';
import { getDefaultProviderImageModel } from '@/infrastructure/providers/providerImageCatalog';
import { normalizeImageGenerationSettings } from '@/infrastructure/providers/imageGenerationSettings';
import { normalizeTavilyConfig } from '@/infrastructure/providers/tavily';
import type { OpenAIRequestMode } from '@/infrastructure/providers/types';
import { sanitizeApiKey } from '@/infrastructure/providers/utils';

const normalizeModelName = (value?: string): string => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : '';
};

const normalizeSystemPrompt = (value?: string): string => value?.trim() ?? '';

const normalizeImageModelName = (providerId: ProviderId, value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : getDefaultProviderImageModel(providerId);
};

const normalizeBaseUrl = (providerId: ProviderId, value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0
    ? normalizeBaseUrlForProvider(providerId, trimmed)
    : undefined;
};

const normalizeStoredCustomHeaders = (
  headers?: Array<{ key?: string; value?: string }>
): Array<{ key: string; value: string }> | undefined => {
  if (!headers) return undefined;
  return normalizeHeaders(headers);
};

const normalizeRequestMode = (
  providerId: ProviderId,
  value?: string
): OpenAIRequestMode | undefined => {
  if (!supportsProviderRequestMode(providerId)) {
    return undefined;
  }

  if (value === undefined) {
    return undefined;
  }

  return value === 'responses' ? 'responses' : 'chat_completions';
};

export const canonicalizeStoredProviderSettings = (
  providerId: ProviderId,
  defaults: ProviderSettings,
  storedSettings: Partial<ProviderSettings>
): ProviderSettings => {
  return {
    apiKey: defaults.apiKey,
    modelName: defaults.modelName,
    systemPrompt: normalizeSystemPrompt(defaults.systemPrompt),
    imageModelName: normalizeImageModelName(providerId, storedSettings.imageModelName),
    imageGeneration: normalizeImageGenerationSettings(storedSettings.imageGeneration),
    requestMode: defaults.requestMode,
    baseUrl: defaults.baseUrl,
    customHeaders: defaults.customHeaders,
    tavily: normalizeTavilyConfig(storedSettings.tavily) ?? defaults.tavily,
    openAdapterTools:
      storedSettings.openAdapterTools !== undefined
        ? normalizeOpenAdapterToolSettings(storedSettings.openAdapterTools)
        : defaults.openAdapterTools,
  };
};

export const normalizeProviderSettingsUpdateAgainstBase = (
  providerId: ProviderId,
  current: ProviderSettings,
  updates: Partial<ProviderSettings>
): ProviderSettings => {
  return {
    apiKey: updates.apiKey !== undefined ? sanitizeApiKey(updates.apiKey) : current.apiKey,
    modelName:
      updates.modelName !== undefined ? normalizeModelName(updates.modelName) : current.modelName,
    systemPrompt:
      updates.systemPrompt !== undefined
        ? normalizeSystemPrompt(updates.systemPrompt)
        : current.systemPrompt,
    imageModelName:
      updates.imageModelName !== undefined
        ? normalizeImageModelName(providerId, updates.imageModelName)
        : current.imageModelName,
    imageGeneration:
      updates.imageGeneration !== undefined
        ? normalizeImageGenerationSettings(updates.imageGeneration)
        : current.imageGeneration,
    requestMode:
      updates.requestMode !== undefined
        ? normalizeRequestMode(providerId, updates.requestMode)
        : current.requestMode,
    baseUrl:
      updates.baseUrl !== undefined
        ? normalizeBaseUrl(providerId, updates.baseUrl)
        : current.baseUrl,
    customHeaders:
      updates.customHeaders !== undefined
        ? normalizeStoredCustomHeaders(updates.customHeaders)
        : current.customHeaders,
    tavily: updates.tavily !== undefined ? normalizeTavilyConfig(updates.tavily) : current.tavily,
    openAdapterTools:
      updates.openAdapterTools !== undefined
        ? normalizeOpenAdapterToolSettings(updates.openAdapterTools)
        : current.openAdapterTools,
  };
};
