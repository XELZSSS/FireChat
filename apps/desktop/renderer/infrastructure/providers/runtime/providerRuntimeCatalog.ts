import type { ProviderConfigModelEntry } from '@contracts/provider-config';
import type { ProviderId } from '@/shared/types/chat';
import type { ProviderModelItem } from '@/infrastructure/providers/types';
import { buildRuntimeProviderConfigs } from '@/infrastructure/providers/runtime/providerRuntimeResolvers';
import { createDynamicRecord } from '@/infrastructure/providers/runtime/providerRuntimeShared';
import type {
  ProviderResolvedConfig,
  ProviderRuntimeTransport,
  ProviderUiMeta,
} from '@/infrastructure/providers/runtime/providerRuntimeTypes';

export type {
  ProviderResolvedConfig,
  ProviderRuntimeTransport,
  ProviderUiMeta,
} from '@/infrastructure/providers/runtime/providerRuntimeTypes';

let cachedProviderResolvedConfigs: Record<ProviderId, ProviderResolvedConfig> | null = null;

export const invalidateProviderRuntimeCatalog = (): void => {
  cachedProviderResolvedConfigs = null;
};

export const getProviderResolvedConfigs = (): Record<ProviderId, ProviderResolvedConfig> => {
  if (!cachedProviderResolvedConfigs) {
    cachedProviderResolvedConfigs = buildRuntimeProviderConfigs();
  }

  return cachedProviderResolvedConfigs;
};

export const getProviderResolvedConfig = (id: ProviderId): ProviderResolvedConfig => {
  const config = getProviderResolvedConfigs()[id];
  if (!config) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return config;
};

export const getProviderUiMetaMap = (): Record<ProviderId, ProviderUiMeta> => {
  return Object.fromEntries(
    Object.values(getProviderResolvedConfigs()).map((entry) => [
      entry.id,
      {
        label: entry.label,
        ...entry.capabilities,
        isOfficialProvider: entry.isOfficialProvider,
        icon: entry.icon,
        source: entry.source,
        transport: entry.transport,
      },
    ])
  );
};

export const getProviderUiMeta = (providerId: ProviderId): ProviderUiMeta | undefined => {
  return getProviderUiMetaMap()[providerId];
};

export const listRuntimeProviderIds = (): ProviderId[] => Object.keys(getProviderResolvedConfigs());

export const getProviderTransport = (
  providerId: ProviderId
): ProviderRuntimeTransport | undefined => getProviderResolvedConfigs()[providerId]?.transport;

export const getProviderConfiguredModels = (
  providerId: ProviderId
): Record<string, ProviderConfigModelEntry> => {
  return getProviderResolvedConfigs()[providerId]?.configuredModels ?? {};
};

export const getProviderConfiguredModelItems = (providerId: ProviderId): ProviderModelItem[] => {
  return Object.entries(getProviderConfiguredModels(providerId)).map(([id, entry]) => ({
    id,
    name: entry.label?.trim() || id,
    group: entry.group?.trim() || undefined,
    description: entry.description?.trim() || undefined,
  }));
};

export const DYNAMIC_PROVIDER_CONFIGS = createDynamicRecord(getProviderResolvedConfigs);
export const DYNAMIC_PROVIDER_UI_META = createDynamicRecord(getProviderUiMetaMap);
