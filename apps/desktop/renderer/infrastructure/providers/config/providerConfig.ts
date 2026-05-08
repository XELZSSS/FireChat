import type { ProviderId } from '@/shared/types/chat';
import type {
  ProviderCapabilities,
  ProviderConfig,
  ProviderModelSpec,
} from '@/infrastructure/providers/config/providerManifest';
import {
  DYNAMIC_PROVIDER_CONFIGS,
  DYNAMIC_PROVIDER_UI_META,
  getProviderResolvedConfig,
  getProviderUiMeta,
  type ProviderResolvedConfig,
  type ProviderUiMeta,
} from '@/infrastructure/providers/runtime/providerRuntimeCatalog';

export type { ProviderCapabilities, ProviderConfig, ProviderModelSpec, ProviderResolvedConfig };

export { invalidateProviderRuntimeCatalog } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';

export const PROVIDER_CONFIGS = DYNAMIC_PROVIDER_CONFIGS as Record<ProviderId, ProviderConfig>;

export const PROVIDER_UI_META = DYNAMIC_PROVIDER_UI_META as Record<ProviderId, ProviderUiMeta>;

export const getProviderDefaults = (id: ProviderId) => {
  const config = getProviderResolvedConfig(id);

  return {
    defaultModel: config.defaultModel,
    models: config.models,
    defaultApiKey: config.defaultApiKey,
    defaultBaseUrl: config.defaultBaseUrl,
    defaultRequestMode: config.defaultRequestMode,
    defaultSystemPrompt: config.defaultSystemPrompt,
    defaultCustomHeaders: config.defaultCustomHeaders,
  };
};

export const getProviderUiMetaForId = (id: ProviderId): ProviderUiMeta | undefined =>
  getProviderUiMeta(id);
