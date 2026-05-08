import { ProviderId } from '@/shared/types/chat';
import { createProvider } from '@/infrastructure/providers/registry';
import type { ProviderModelItem } from '@/infrastructure/providers/types';
import type { ProviderSettings } from '@/infrastructure/providers/defaults';
import { upsertProviderSnapshot } from '@/infrastructure/providers/runtime/providerFileMutations';
import { getProviderConfiguredModelItems } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import {
  getCurrentProviderFileSnapshot,
  persistProviderRuntimeState,
} from '@/infrastructure/providers/runtime/providerRuntimeSync';

const pendingProviderModelFetches = new Map<string, Promise<ProviderModelItem[]>>();

export const getCachedProviderModels = (providerId: ProviderId): ProviderModelItem[] => {
  return getProviderConfiguredModelItems(providerId);
};

const persistFetchedProviderModels = async (
  providerId: ProviderId,
  settings: ProviderSettings,
  items: ProviderModelItem[]
): Promise<void> => {
  const snapshot = upsertProviderSnapshot(
    getCurrentProviderFileSnapshot(),
    providerId,
    settings,
    items
  );
  await persistProviderRuntimeState(snapshot);
};

export const fetchProviderModels = async (
  providerId: ProviderId,
  settings: ProviderSettings
): Promise<ProviderModelItem[]> => {
  const requestKey = JSON.stringify({
    providerId,
    modelName: settings.modelName,
    apiKey: settings.apiKey ?? '',
    baseUrl: settings.baseUrl ?? '',
    customHeaders: settings.customHeaders ?? [],
    requestMode: settings.requestMode ?? null,
  });
  const pendingFetch = pendingProviderModelFetches.get(requestKey);
  if (pendingFetch) {
    return pendingFetch;
  }

  const provider = createProvider(providerId);
  provider.setModelName(settings.modelName);
  provider.setApiKey(settings.apiKey);
  provider.setBaseUrl?.(settings.baseUrl);
  provider.setCustomHeaders?.(settings.customHeaders ?? []);
  if (settings.requestMode) {
    provider.setRequestMode?.(settings.requestMode);
  }

  const fetchPromise = (async () => {
    const items = (await provider.listModels?.()) ?? [];
    await persistFetchedProviderModels(providerId, settings, items);
    return items;
  })();

  pendingProviderModelFetches.set(requestKey, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    pendingProviderModelFetches.delete(requestKey);
  }
};
