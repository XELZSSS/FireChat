import { useCallback, useMemo, useState } from 'react';
import type { ProviderId } from '@/shared/types/chat';
import {
  fetchProviderImageModels,
  getCachedProviderImageModels,
} from '@/infrastructure/providers/providerImageCatalog';
import { loadProviderSettings } from '@/infrastructure/persistence/providerSettingsStore';

const getImageModelFetchErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Failed to fetch image models.';
};

type UseProviderImageModelCatalogOptions = {
  providerId: ProviderId;
  modelName: string;
  imageModelName: string;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  requestMode?: import('@/infrastructure/providers/types').OpenAIRequestMode;
};

export const useProviderImageModelCatalog = ({
  providerId,
  modelName,
  imageModelName,
  apiKey,
  baseUrl,
  customHeaders,
  requestMode,
}: UseProviderImageModelCatalogOptions) => {
  const [fetchedImageModelsByProvider, setFetchedImageModelsByProvider] = useState<
    Partial<Record<string, ReturnType<typeof getCachedProviderImageModels>>>
  >({});
  const [imageModelFetchErrorsByProvider, setImageModelFetchErrorsByProvider] = useState<
    Partial<Record<string, string | null>>
  >({});
  const [fetchingProviderId, setFetchingProviderId] = useState<string | null>(null);

  const availableImageModels = useMemo(
    () => fetchedImageModelsByProvider[providerId] ?? getCachedProviderImageModels(providerId),
    [fetchedImageModelsByProvider, providerId]
  );

  const clearProviderImageModelFetchError = useCallback((targetProviderId: string) => {
    setImageModelFetchErrorsByProvider((current) => ({
      ...current,
      [targetProviderId]: null,
    }));
  }, []);

  const handleFetchImageModels = useCallback(async () => {
    const targetProviderId = providerId;
    setFetchingProviderId(targetProviderId);
    clearProviderImageModelFetchError(targetProviderId);

    try {
      const persistedSettings = loadProviderSettings();
      const items = await fetchProviderImageModels(targetProviderId, {
        ...persistedSettings[targetProviderId],
        modelName,
        imageModelName,
        apiKey,
        baseUrl,
        customHeaders,
        requestMode,
      });

      setFetchedImageModelsByProvider((current) => ({
        ...current,
        [targetProviderId]: items,
      }));

      if (items.length === 0) {
        setImageModelFetchErrorsByProvider((current) => ({
          ...current,
          [targetProviderId]: 'No image models returned by this provider.',
        }));
      }
    } catch (error) {
      setImageModelFetchErrorsByProvider((current) => ({
        ...current,
        [targetProviderId]: getImageModelFetchErrorMessage(error),
      }));
    } finally {
      setFetchingProviderId((current) => (current === targetProviderId ? null : current));
    }
  }, [
    apiKey,
    baseUrl,
    clearProviderImageModelFetchError,
    customHeaders,
    imageModelName,
    modelName,
    providerId,
    requestMode,
  ]);

  return {
    availableImageModels,
    isFetchingImageModels: fetchingProviderId === providerId,
    imageModelFetchError: imageModelFetchErrorsByProvider[providerId] ?? null,
    handleFetchImageModels,
    clearProviderImageModelFetchError,
  };
};
