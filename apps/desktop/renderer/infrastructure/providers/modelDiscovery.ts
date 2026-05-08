import type { ProviderModelItem } from '@/infrastructure/providers/types';

type OpenAIStyleModelRecord = {
  id?: unknown;
  name?: unknown;
  owned_by?: unknown;
  description?: unknown;
};

type GoogleGenerativeAIModelRecord = {
  name?: unknown;
  displayName?: unknown;
  description?: unknown;
  supportedGenerationMethods?: unknown;
};

type GoogleVertexModelRecord = {
  name?: unknown;
  displayName?: unknown;
  description?: unknown;
  versionId?: unknown;
  publisher?: unknown;
};

type CohereModelRecord = {
  name?: unknown;
  endpoints?: unknown;
  default_endpoints?: unknown;
  features?: unknown;
};

type FetchOpenAIStyleModelsOptions = {
  baseUrl: string;
  apiKey?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  fetcher?: typeof fetch;
};

const normalizeModelString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const joinUrl = (baseUrl: string, path: string): string => {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

const toGoogleVertexModelListBaseUrl = (baseUrl: string): string => {
  return baseUrl.replace(/\/v1(?=\/)/, '/v1beta1');
};

const getResourceModelId = (value: unknown): string | undefined => {
  const normalized = normalizeModelString(value);
  if (!normalized) {
    return undefined;
  }

  return normalized.split('/').pop()?.trim() || normalized;
};

const buildHeaders = ({
  apiKey,
  customHeaders,
}: Pick<FetchOpenAIStyleModelsOptions, 'apiKey' | 'customHeaders'>): Headers => {
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  if (apiKey?.trim()) {
    headers.set('Authorization', `Bearer ${apiKey.trim()}`);
  }

  customHeaders?.forEach((header) => {
    const key = header.key.trim();
    const value = header.value.trim();
    if (key && value) {
      headers.set(key, value);
    }
  });

  return headers;
};

const buildGoogleHeaders = ({
  apiKey,
  customHeaders,
}: Pick<FetchOpenAIStyleModelsOptions, 'apiKey' | 'customHeaders'>): Headers => {
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  if (apiKey?.trim()) {
    headers.set('x-goog-api-key', apiKey.trim());
  }

  customHeaders?.forEach((header) => {
    const key = header.key.trim();
    const value = header.value.trim();
    if (key && value) {
      headers.set(key, value);
    }
  });

  return headers;
};

const fetchJsonPayload = async <T>({
  url,
  headers,
  fetcher,
  errorLabel,
}: {
  url: string;
  headers: Headers;
  fetcher: typeof fetch;
  errorLabel: string;
}): Promise<T | null> => {
  const response = await fetcher(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`${errorLabel}: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  const raw = await response.text();
  if (!raw.trim()) {
    return null;
  }

  return JSON.parse(raw) as T;
};

export const fetchOpenAIStyleModels = async ({
  baseUrl,
  apiKey,
  customHeaders,
  fetcher = fetch,
}: FetchOpenAIStyleModelsOptions): Promise<ProviderModelItem[]> => {
  const payload = await fetchJsonPayload<{ data?: OpenAIStyleModelRecord[] }>({
    url: joinUrl(baseUrl, '/models'),
    headers: buildHeaders({ apiKey, customHeaders }),
    fetcher,
    errorLabel: 'Failed to fetch models',
  });

  const models = Array.isArray(payload?.data) ? payload.data : [];
  const seen = new Set<string>();

  return models.flatMap((item) => {
    const id = normalizeModelString(item.id);
    if (!id || seen.has(id)) {
      return [];
    }

    seen.add(id);
    return [
      {
        id,
        name: normalizeModelString(item.name) ?? id,
        group: normalizeModelString(item.owned_by),
        description: normalizeModelString(item.description),
      },
    ];
  });
};

export const fetchGoogleGenerativeAIModels = async ({
  baseUrl,
  apiKey,
  fetcher = fetch,
}: Omit<FetchOpenAIStyleModelsOptions, 'customHeaders'>): Promise<ProviderModelItem[]> => {
  const payload = await fetchJsonPayload<{ models?: GoogleGenerativeAIModelRecord[] }>({
    url: joinUrl(baseUrl, '/models'),
    headers: buildGoogleHeaders({ apiKey }),
    fetcher,
    errorLabel: 'Failed to fetch models',
  });

  const models = Array.isArray(payload?.models) ? payload.models : [];
  const seen = new Set<string>();

  return models.flatMap((item) => {
    const resourceName = normalizeModelString(item.name);
    const id = resourceName?.replace(/^models\//, '');
    const methods = Array.isArray(item.supportedGenerationMethods)
      ? item.supportedGenerationMethods
      : [];

    if (!id || seen.has(id) || !methods.includes('generateContent')) {
      return [];
    }

    seen.add(id);
    return [
      {
        id,
        name: normalizeModelString(item.displayName) ?? id,
        description: normalizeModelString(item.description),
      },
    ];
  });
};

const isGoogleImageModel = (item: GoogleGenerativeAIModelRecord): boolean => {
  const resourceName = normalizeModelString(item.name) ?? '';
  const displayName = normalizeModelString(item.displayName) ?? '';
  const methods = Array.isArray(item.supportedGenerationMethods)
    ? item.supportedGenerationMethods.map((method) => normalizeModelString(method)?.toLowerCase())
    : [];
  const searchable = `${resourceName} ${displayName}`.toLowerCase();

  return (
    searchable.includes('imagen') ||
    searchable.includes('image') ||
    methods.includes('generateimages')
  );
};

export const fetchGoogleGenerativeAIImageModels = async ({
  baseUrl,
  apiKey,
  fetcher = fetch,
}: Omit<FetchOpenAIStyleModelsOptions, 'customHeaders'>): Promise<ProviderModelItem[]> => {
  const payload = await fetchJsonPayload<{ models?: GoogleGenerativeAIModelRecord[] }>({
    url: joinUrl(baseUrl, '/models'),
    headers: buildGoogleHeaders({ apiKey }),
    fetcher,
    errorLabel: 'Failed to fetch image models',
  });

  const models = Array.isArray(payload?.models) ? payload.models : [];
  const seen = new Set<string>();

  return models.flatMap((item) => {
    const id = getResourceModelId(item.name);
    if (!id || seen.has(id) || !isGoogleImageModel(item)) {
      return [];
    }

    seen.add(id);
    return [
      {
        id,
        name: normalizeModelString(item.displayName) ?? id,
        description: normalizeModelString(item.description),
      },
    ];
  });
};

export const fetchGoogleVertexModels = async ({
  baseUrl,
  apiKey,
  customHeaders,
  fetcher = fetch,
}: FetchOpenAIStyleModelsOptions): Promise<ProviderModelItem[]> => {
  const headers = buildGoogleHeaders({ apiKey, customHeaders });
  const listUrl = joinUrl(toGoogleVertexModelListBaseUrl(baseUrl), '/models');
  const models: GoogleVertexModelRecord[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(listUrl);
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const payload = await fetchJsonPayload<{
      publisherModels?: GoogleVertexModelRecord[];
      models?: GoogleVertexModelRecord[];
      data?: GoogleVertexModelRecord[];
      items?: GoogleVertexModelRecord[];
      nextPageToken?: unknown;
    }>({
      url: url.toString(),
      headers,
      fetcher,
      errorLabel: 'Failed to fetch models',
    });

    if (!payload) {
      return [];
    }

    const pageModels = Array.isArray(payload.publisherModels)
      ? payload.publisherModels
      : Array.isArray(payload.models)
        ? payload.models
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.items)
            ? payload.items
            : [];

    models.push(...pageModels);
    pageToken = normalizeModelString(payload.nextPageToken);
  } while (pageToken);

  const seen = new Set<string>();

  return models.flatMap((item) => {
    const id = getResourceModelId(item.name);
    if (!id || seen.has(id)) {
      return [];
    }

    seen.add(id);
    return [
      {
        id,
        name: normalizeModelString(item.displayName) ?? id,
        group: normalizeModelString(item.publisher),
        description: normalizeModelString(item.description) ?? normalizeModelString(item.versionId),
      },
    ];
  });
};

const hasCohereChatEndpoint = (item: CohereModelRecord): boolean => {
  const endpoints = [
    ...(Array.isArray(item.endpoints) ? item.endpoints : []),
    ...(Array.isArray(item.default_endpoints) ? item.default_endpoints : []),
  ]
    .map((value) => normalizeModelString(value)?.toLowerCase())
    .filter(Boolean);

  if (endpoints.length === 0) {
    return true;
  }

  return endpoints.includes('chat');
};

export const fetchCohereModels = async ({
  baseUrl,
  apiKey,
  fetcher = fetch,
}: Omit<FetchOpenAIStyleModelsOptions, 'customHeaders'>): Promise<ProviderModelItem[]> => {
  const payload = await fetchJsonPayload<{ models?: CohereModelRecord[] }>({
    url: `${baseUrl.replace(/\/+$/, '')}/models?endpoint=chat`,
    headers: buildHeaders({ apiKey }),
    fetcher,
    errorLabel: 'Failed to fetch models',
  });

  const models = Array.isArray(payload?.models) ? payload.models : [];
  const seen = new Set<string>();

  return models.flatMap((item) => {
    const id = normalizeModelString(item.name);
    if (!id || seen.has(id) || !hasCohereChatEndpoint(item)) {
      return [];
    }

    seen.add(id);
    return [
      {
        id,
        name: id,
        description: Array.isArray(item.features)
          ? item.features
              .map((feature) => normalizeModelString(feature))
              .filter(Boolean)
              .join(', ') || undefined
          : undefined,
      },
    ];
  });
};
