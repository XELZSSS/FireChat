import { useCallback, useMemo, useState } from 'react';
import { loadProviderSettings } from '@/infrastructure/persistence/providerSettingsStore';
import type { OpenAIRequestMode, ProviderModelItem } from '@/infrastructure/providers/types';

type ModelCatalogConfig = {
  fetchFn: (
    providerId: string,
    settings: Record<string, unknown>
  ) => Promise<ProviderModelItem[]>;
  cacheFn: (providerId: string) => ProviderModelItem[];
  emptyMessage: string;
  errorMessage: string;
};

type UseModelCatalogOptions = {
  providerId: string;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  requestMode?: OpenAIRequestMode;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const useModelCatalog = (
  config: ModelCatalogConfig,
  {
    providerId,
    modelName,
    apiKey,
    baseUrl,
    customHeaders,
    requestMode,
  }: UseModelCatalogOptions
) => {
  const [fetchedModelsByProvider, setFetchedModelsByProvider] = useState<
    Partial<Record<string, ProviderModelItem[]>>
  >({});
  const [fetchErrorsByProvider, setFetchErrorsByProvider] = useState<
    Partial<Record<string, string | null>>
  >({});
  const [fetchingProviderId, setFetchingProviderId] = useState<string | null>(null);

  const availableModels = useMemo(
    () => fetchedModelsByProvider[providerId] ?? config.cacheFn(providerId),
    [fetchedModelsByProvider, providerId, config]
  );

  const clearFetchError = useCallback((targetProviderId: string) => {
    setFetchErrorsByProvider((current) => ({
      ...current,
      [targetProviderId]: null,
    }));
  }, []);

  const handleFetchModels = useCallback(async () => {
    const targetProviderId = providerId;
    setFetchingProviderId(targetProviderId);
    clearFetchError(targetProviderId);

    try {
      const persistedSettings = loadProviderSettings();
      const items = await config.fetchFn(targetProviderId, {
        ...persistedSettings[targetProviderId],
        modelName,
        apiKey,
        baseUrl,
        customHeaders,
        requestMode,
      });

      setFetchedModelsByProvider((current) => ({
        ...current,
        [targetProviderId]: items,
      }));

      if (items.length === 0) {
        setFetchErrorsByProvider((current) => ({
          ...current,
          [targetProviderId]: config.emptyMessage,
        }));
      }
    } catch (error) {
      setFetchErrorsByProvider((current) => ({
        ...current,
        [targetProviderId]: getErrorMessage(error, config.errorMessage),
      }));
    } finally {
      setFetchingProviderId((current) => (current === targetProviderId ? null : current));
    }
  }, [
    apiKey,
    baseUrl,
    clearFetchError,
    config,
    customHeaders,
    modelName,
    providerId,
    requestMode,
  ]);

  return {
    availableModels,
    isFetchingModels: fetchingProviderId === providerId,
    fetchError: fetchErrorsByProvider[providerId] ?? null,
    handleFetchModels,
    clearFetchError,
  };
};