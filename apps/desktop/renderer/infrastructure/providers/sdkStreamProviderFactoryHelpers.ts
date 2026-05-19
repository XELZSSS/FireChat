import { getProviderDefaults } from '@/infrastructure/providers/config/providerConfig';
import { getProviderResolvedConfig } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import { AISdkStreamProvider } from '@/infrastructure/providers/sdkStreamProvider';
import type {
  ProviderChat,
  ProviderModelItem,
  ProviderReasoningPreference,
} from '@/infrastructure/providers/types';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type { AISdkStreamProviderOptions } from '@/infrastructure/providers/sdkStreamProvider';
import type { SdkStreamBuiltInProviderId } from '@/infrastructure/providers/builtInProviderGroups';

type ProviderFactoryContext = {
  apiKey: string;
  baseUrl?: string;
  fetch: typeof fetch;
  customHeaders?: Array<{ key: string; value: string }>;
};

type ProviderModelListContext = {
  apiKey: string;
  baseUrl: string;
  fetch: typeof fetch;
  customHeaders?: Array<{ key: string; value: string }>;
};

type ProviderOptionsContext = {
  modelName: string;
  requestModelName: string;
  emitReasoning: boolean;
  reasoningPreference: ProviderReasoningPreference;
  requestPolicy?: RequestPolicy;
};

export type OpenAIStyleProviderBuilderOptions<TProvider> = {
  providerId: SdkStreamBuiltInProviderId;
  getDefaultBaseUrl: () => string | undefined;
  normalizeBaseUrl?: (value: string) => string;
  missingApiKeyError: string;
  createSdkProvider: (context: ProviderFactoryContext) => TProvider;
  createModel?: AISdkStreamProviderOptions<TProvider>['createModel'];
  buildProviderOptions?: (context: ProviderOptionsContext) => Record<string, unknown> | undefined;
  listModels?: (context: ProviderModelListContext) => Promise<ProviderModelItem[]>;
  resolveRequestModelName?: (context: { modelName: string; emitReasoning: boolean }) => string;
};

export const createBaseUrlResolver = (
  providerId: SdkStreamBuiltInProviderId,
  defaultResolver: () => string | undefined,
  normalize: (value: string) => string = (value) => value
) => {
  const defaults = getProviderDefaults(providerId);
  const defaultBaseUrl = defaults.defaultBaseUrl ?? defaultResolver();

  return {
    defaults,
    getDefaultBaseUrl: () => defaultBaseUrl,
    normalizeBaseUrl: (baseUrl: string) => {
      const trimmed = baseUrl.trim();
      if (trimmed) return normalize(trimmed);
      return defaultBaseUrl ? normalize(defaultBaseUrl) : undefined;
    },
  };
};

export const toHeaderRecord = (
  headers?: Array<{ key: string; value: string }>
): Record<string, string> =>
  Object.fromEntries(
    (headers ?? [])
      .map((header) => [header.key.trim(), header.value.trim()] as const)
      .filter(([key, value]) => key && value)
  );

export const normalizeTrimmedBaseUrl = (value: string): string => value.trim().replace(/\/+$/, '');

export const normalizePerplexityBaseUrl = (value: string): string => {
  const resolved = normalizeTrimmedBaseUrl(value);
  return resolved.replace(/\/(?:v1(?:\/sonar)?|chat\/completions)\/?$/i, '');
};

export const normalizeCohereSdkBaseUrl = (value: string): string => {
  const resolved = normalizeTrimmedBaseUrl(value);

  if (resolved.endsWith('/compatibility/v1')) {
    return `${resolved.slice(0, -'/compatibility/v1'.length)}/v2`;
  }

  if (resolved.endsWith('/compatibility')) {
    return `${resolved.slice(0, -'/compatibility'.length)}/v2`;
  }

  if (resolved.endsWith('/v1')) {
    return `${resolved.slice(0, -3)}/v2`;
  }

  if (resolved.endsWith('/v2')) {
    return resolved;
  }

  return `${resolved}/v2`;
};

export const getCohereModelsApiBaseUrl = (sdkBaseUrl: string): string => {
  const trimmed = sdkBaseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/v2')) {
    return `${trimmed.slice(0, -3)}/v1`;
  }

  return `${trimmed}/v1`;
};

export const createOpenAIStyleSdkProviderFactory = <TProvider>({
  providerId,
  getDefaultBaseUrl,
  normalizeBaseUrl,
  missingApiKeyError,
  createSdkProvider,
  createModel,
  buildProviderOptions,
  listModels,
  resolveRequestModelName,
}: OpenAIStyleProviderBuilderOptions<TProvider>): ProviderChat => {
  const {
    defaults,
    getDefaultBaseUrl: resolveDefaultBaseUrl,
    normalizeBaseUrl: resolveNormalizedBaseUrl,
  } = createBaseUrlResolver(providerId, getDefaultBaseUrl, normalizeBaseUrl);
  const config = getProviderResolvedConfig(providerId);

  return new AISdkStreamProvider<TProvider>({
    id: providerId,
    defaultModel: defaults.defaultModel,
    defaultApiKey: defaults.defaultApiKey,
    getDefaultBaseUrl: resolveDefaultBaseUrl,
    normalizeBaseUrl: resolveNormalizedBaseUrl,
    missingApiKeyError,
    logLabel: config.label,

    supportsBaseUrl: config.capabilities.supportsBaseUrl,
    supportsCustomHeaders: config.capabilities.supportsCustomHeaders,
    createSdkProvider,
    createModel:
      createModel ??
      (({ provider, requestModelName }) =>
        (provider as (modelName: string) => unknown)(requestModelName)),
    buildProviderOptions,
    listModels,
    resolveRequestModelName,
  });
};
