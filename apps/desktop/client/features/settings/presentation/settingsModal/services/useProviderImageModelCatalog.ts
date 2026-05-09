import type { ProviderId } from '@/shared/types/chat';
import {
  fetchProviderImageModels,
  getCachedProviderImageModels,
} from '@/infrastructure/providers/providerImageCatalog';
import { useModelCatalog } from '@client/features/settings/presentation/settingsModal/services/useModelCatalog';
import type { ProviderModelItem } from '@/infrastructure/providers/types';

type UseProviderImageModelCatalogOptions = {
  providerId: ProviderId;
  modelName: string;
  imageModelName: string;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  requestMode?: import('@/infrastructure/providers/types').OpenAIRequestMode;
};

export const useProviderImageModelCatalog = (options: UseProviderImageModelCatalogOptions) => {
  const { availableModels, isFetchingModels, fetchError, handleFetchModels, clearFetchError } =
    useModelCatalog(
      {
        fetchFn: fetchProviderImageModels as unknown as (
          providerId: string,
          settings: Record<string, unknown>
        ) => Promise<ProviderModelItem[]>,
        cacheFn: getCachedProviderImageModels,
        emptyMessage: 'No image models returned by this provider.',
        errorMessage: 'Failed to fetch image models.',
      },
      options
    );

  return {
    availableImageModels: availableModels,
    isFetchingImageModels: isFetchingModels,
    imageModelFetchError: fetchError,
    handleFetchImageModels: handleFetchModels,
    clearProviderImageModelFetchError: clearFetchError,
  };
};