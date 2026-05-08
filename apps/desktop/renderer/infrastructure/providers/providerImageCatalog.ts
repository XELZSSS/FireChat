import { ProviderId } from '@/shared/types/chat';
import type { ProviderSettings } from '@/infrastructure/providers/defaults';
import type { ProviderModelItem } from '@/infrastructure/providers/types';
import { resolveBaseUrlForProvider } from '@/infrastructure/providers/config/baseUrl';
import {
  fetchGoogleGenerativeAIImageModels,
  fetchGoogleVertexModels,
  fetchOpenAIStyleModels,
} from '@/infrastructure/providers/modelDiscovery';
import { providerHttpFetch } from '@/infrastructure/network/proxyFetch';
import { upsertProviderImageModelsSnapshot } from '@/infrastructure/providers/runtime/providerFileMutations';
import {
  getStaticImageModelItems,
  supportsImageGenerationProvider,
} from '@/infrastructure/providers/providerImageMetadata';
import {
  getCurrentProviderFileSnapshot,
  persistProviderRuntimeState,
} from '@/infrastructure/providers/runtime/providerRuntimeSync';

const OPENROUTER_IMAGE_MODELS_API_PATH = '/models?output_modalities=image';

const toUniqueItems = (items: ProviderModelItem[]): ProviderModelItem[] => {
  const seen = new Set<string>();

  return items.flatMap((item) => {
    const id = item.id.trim();
    if (!id || seen.has(id)) {
      return [];
    }

    seen.add(id);
    return [
      {
        ...item,
        id,
        name: item.name.trim() || id,
        group: item.group?.trim() || undefined,
        description: item.description?.trim() || undefined,
      },
    ];
  });
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const buildHeaders = (settings: ProviderSettings): Headers => {
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  const apiKey = settings.apiKey?.trim();
  if (apiKey) {
    headers.set('Authorization', `Bearer ${apiKey}`);
  }

  settings.customHeaders?.forEach((header) => {
    const key = header.key.trim();
    const value = header.value.trim();
    if (key && value) {
      headers.set(key, value);
    }
  });

  return headers;
};

const fetchOpenRouterImageModels = async (
  settings: ProviderSettings,
  fetcher: typeof fetch = providerHttpFetch
): Promise<ProviderModelItem[]> => {
  const baseUrl = trimTrailingSlash(settings.baseUrl ?? 'https://openrouter.ai/api/v1');
  const response = await fetcher(`${baseUrl}${OPENROUTER_IMAGE_MODELS_API_PATH}`, {
    method: 'GET',
    headers: buildHeaders(settings),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image models: ${response.status} ${response.statusText}`);
  }

  const raw = await response.text();
  if (!raw.trim()) {
    return [];
  }

  const payload = JSON.parse(raw) as {
    data?: Array<{
      id?: unknown;
      name?: unknown;
      description?: unknown;
      top_provider?: { organization?: unknown };
    }>;
  };

  return toUniqueItems(
    (Array.isArray(payload.data) ? payload.data : []).flatMap((item) => {
      if (typeof item.id !== 'string' || !item.id.trim()) {
        return [];
      }

      return [
        {
          id: item.id.trim(),
          name:
            typeof item.name === 'string' && item.name.trim().length > 0
              ? item.name.trim()
              : item.id.trim(),
          group:
            typeof item.top_provider?.organization === 'string' &&
            item.top_provider.organization.trim().length > 0
              ? item.top_provider.organization.trim()
              : undefined,
          description:
            typeof item.description === 'string' && item.description.trim().length > 0
              ? item.description.trim()
              : undefined,
        },
      ];
    })
  );
};

const requireProviderBaseUrl = (providerId: ProviderId, settings: ProviderSettings): string => {
  const baseUrl = resolveBaseUrlForProvider(providerId, settings.baseUrl);
  if (!baseUrl) {
    throw new Error('Missing provider base URL.');
  }
  return baseUrl;
};

const getImageModelSearchText = (item: ProviderModelItem): string =>
  `${item.id} ${item.name} ${item.group ?? ''} ${item.description ?? ''}`.toLowerCase();

const isImageModelItem = (providerId: ProviderId, item: ProviderModelItem): boolean => {
  if (providerId === 'openrouter') {
    return true;
  }

  const text = getImageModelSearchText(item);

  if (providerId === 'openai') {
    return text.includes('gpt-image') || text.includes('dall-e') || text.includes('image');
  }

  if (providerId === 'google' || providerId === 'google-vertex') {
    return text.includes('imagen') || text.includes('image');
  }

  if (providerId === 'xai') {
    return text.includes('grok-imagine') || text.includes('image');
  }

  if (providerId === 'glm') {
    return text.includes('glm-image') || text.includes('cogview') || text.includes('image');
  }

  if (providerId === 'minimax') {
    return text.includes('image');
  }

  return [
    'image',
    'imagen',
    'dall-e',
    'flux',
    'stable-diffusion',
    'sdxl',
    'playground',
    'seedream',
    'cogview',
    'grok-imagine',
    'ssd',
  ].some((keyword) => text.includes(keyword));
};

const fetchOpenAIStyleImageModels = async (
  providerId: ProviderId,
  settings: ProviderSettings
): Promise<ProviderModelItem[]> => {
  const items = await fetchOpenAIStyleModels({
    baseUrl: requireProviderBaseUrl(providerId, settings),
    apiKey: settings.apiKey,
    customHeaders: settings.customHeaders,
    fetcher: providerHttpFetch,
  });

  return toUniqueItems(items.filter((item) => isImageModelItem(providerId, item)));
};

const pendingProviderImageModelFetches = new Map<string, Promise<ProviderModelItem[]>>();

const getConfiguredImageModelItems = (providerId: ProviderId): ProviderModelItem[] => {
  const imageModels =
    getCurrentProviderFileSnapshot().config.providers?.[providerId]?.imageModels ?? {};

  return Object.entries(imageModels).map(([id, entry]) => ({
    id,
    name: entry.label?.trim() || id,
    group: entry.group?.trim() || undefined,
    description: entry.description?.trim() || undefined,
  }));
};

const persistFetchedProviderImageModels = async (
  providerId: ProviderId,
  items: ProviderModelItem[]
): Promise<void> => {
  const snapshot = upsertProviderImageModelsSnapshot(
    getCurrentProviderFileSnapshot(),
    providerId,
    items
  );
  await persistProviderRuntimeState(snapshot);
};

export const supportsProviderImageGeneration = (providerId: ProviderId): boolean => {
  return supportsImageGenerationProvider(providerId);
};

export const getDefaultProviderImageModel = (providerId: ProviderId): string | undefined => {
  return getStaticImageModelItems(providerId)[0]?.id;
};

export const getCachedProviderImageModels = (providerId: ProviderId): ProviderModelItem[] => {
  return toUniqueItems([
    ...getConfiguredImageModelItems(providerId),
    ...getStaticImageModelItems(providerId),
  ]);
};

export const fetchProviderImageModels = async (
  providerId: ProviderId,
  settings: ProviderSettings
): Promise<ProviderModelItem[]> => {
  if (!supportsProviderImageGeneration(providerId)) {
    return [];
  }

  const requestKey = JSON.stringify({
    providerId,
    apiKey: settings.apiKey ?? '',
    baseUrl: settings.baseUrl ?? '',
    customHeaders: settings.customHeaders ?? [],
  });
  const pendingFetch = pendingProviderImageModelFetches.get(requestKey);
  if (pendingFetch) {
    return pendingFetch;
  }

  const fetchPromise = (async () => {
    let items: ProviderModelItem[];

    if (getStaticImageModelItems(providerId).length > 0) {
      items = getCachedProviderImageModels(providerId);
    } else if (providerId === 'openrouter') {
      items = await fetchOpenRouterImageModels(settings);
    } else if (providerId === 'google') {
      items = await fetchGoogleGenerativeAIImageModels({
        baseUrl: requireProviderBaseUrl(providerId, settings),
        apiKey: settings.apiKey,
        fetcher: providerHttpFetch,
      });
    } else if (providerId === 'google-vertex') {
      const vertexModels = await fetchGoogleVertexModels({
        baseUrl: requireProviderBaseUrl(providerId, settings),
        apiKey: settings.apiKey,
        customHeaders: settings.customHeaders,
        fetcher: providerHttpFetch,
      });
      items = vertexModels.filter((item) => isImageModelItem(providerId, item));
    } else {
      items = await fetchOpenAIStyleImageModels(providerId, settings);
    }

    await persistFetchedProviderImageModels(providerId, items);
    return items;
  })();

  pendingProviderImageModelFetches.set(requestKey, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    pendingProviderImageModelFetches.delete(requestKey);
  }
};
