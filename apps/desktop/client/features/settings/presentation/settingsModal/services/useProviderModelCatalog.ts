import { useCallback, useMemo, useState } from 'react';
import {
  getCachedProviderModels,
  fetchProviderModels,
} from '@/infrastructure/providers/modelCatalog';
import { loadProviderSettings } from '@/infrastructure/persistence/providerSettingsStore';
import type { OpenAIRequestMode } from '@/infrastructure/providers/types';

const getModelFetchErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Failed to fetch models.';
};

type UseProviderModelCatalogOptions = {
  providerId: string;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  requestMode?: OpenAIRequestMode;
};

export const useProviderModelCatalog = ({
  providerId,
  modelName,
  apiKey,
  baseUrl,
  customHeaders,
  requestMode,
}: UseProviderModelCatalogOptions) => {
  const [fetchedModelsByProvider, setFetchedModelsByProvider] = useState<
    Partial<Record<string, ReturnType<typeof getCachedProviderModels>>>
  >({});
  const [modelFetchErrorsByProvider, setModelFetchErrorsByProvider] = useState<
    Partial<Record<string, string | null>>
  >({});
  const [fetchingProviderId, setFetchingProviderId] = useState<string | null>(null);

  const availableModels = useMemo(
    () => fetchedModelsByProvider[providerId] ?? getCachedProviderModels(providerId),
    [fetchedModelsByProvider, providerId]
  );

  const clearProviderModelFetchError = useCallback((targetProviderId: string) => {
    setModelFetchErrorsByProvider((current) => ({
      ...current,
      [targetProviderId]: null,
    }));
  }, []);

  const handleFetchModels = useCallback(async () => {
    const targetProviderId = providerId;
    setFetchingProviderId(targetProviderId);
    clearProviderModelFetchError(targetProviderId);

    try {
      const persistedSettings = loadProviderSettings();
      const items = await fetchProviderModels(targetProviderId, {
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
        setModelFetchErrorsByProvider((current) => ({
          ...current,
          [targetProviderId]: 'No models returned by this provider.',
        }));
      }
    } catch (error) {
      setModelFetchErrorsByProvider((current) => ({
        ...current,
        [targetProviderId]: getModelFetchErrorMessage(error),
      }));
    } finally {
      setFetchingProviderId((current) => (current === targetProviderId ? null : current));
    }
  }, [
    apiKey,
    baseUrl,
    clearProviderModelFetchError,
    customHeaders,
    modelName,
    providerId,
    requestMode,
  ]);

  return {
    availableModels,
    isFetchingModels: fetchingProviderId === providerId,
    modelFetchError: modelFetchErrorsByProvider[providerId] ?? null,
    handleFetchModels,
    clearProviderModelFetchError,
  };
};
