import {
  getCachedProviderModels,
  fetchProviderModels,
} from '@/infrastructure/providers/modelCatalog';
import { useModelCatalog } from '@client/features/settings/presentation/settingsModal/services/useModelCatalog';
import type { OpenAIRequestMode, ProviderModelItem } from '@/infrastructure/providers/types';

type UseProviderModelCatalogOptions = {
  providerId: string;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  requestMode?: OpenAIRequestMode;
};

export const useProviderModelCatalog = (options: UseProviderModelCatalogOptions) => {
  const { availableModels, isFetchingModels, fetchError, handleFetchModels, clearFetchError } =
    useModelCatalog(
      {
        fetchFn: fetchProviderModels as unknown as (
          providerId: string,
          settings: Record<string, unknown>
        ) => Promise<ProviderModelItem[]>,
        cacheFn: getCachedProviderModels,
        emptyMessage: 'No models returned by this provider.',
        errorMessage: 'Failed to fetch models.',
      },
      options
    );

  return {
    availableModels,
    isFetchingModels,
    modelFetchError: fetchError,
    handleFetchModels,
    clearProviderModelFetchError: clearFetchError,
  };
};
