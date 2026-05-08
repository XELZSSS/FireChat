import type {
  ProviderConfigEntry,
  ProviderConfigModelEntry,
  ProviderTransport,
} from '@contracts/provider-config';
import type { ProviderCapabilities } from '@/infrastructure/providers/config/providerManifest';

export const CUSTOM_OPENAI_CAPABILITIES: ProviderCapabilities = {
  supportsTavily: true,
  supportsBaseUrl: true,
  supportsCustomHeaders: true,
  supportsRegion: false,
};

export const CUSTOM_OPENAI_COMPATIBLE_CAPABILITIES: ProviderCapabilities = {
  supportsTavily: true,
  supportsBaseUrl: true,
  supportsCustomHeaders: true,
  supportsRegion: false,
  supportsReasoningToggle: true,
};

export const EMPTY_FILE_ENTRY: ProviderConfigEntry = {};

export const toHeaderPairs = (
  headers?: Record<string, string>
): Array<{ key: string; value: string }> => {
  if (!headers || typeof headers !== 'object') {
    return [];
  }

  return Object.entries(headers).flatMap(([key, value]) => {
    const normalizedKey = key.trim();
    const normalizedValue = typeof value === 'string' ? value.trim() : '';
    if (!normalizedKey || !normalizedValue) {
      return [];
    }

    return [{ key: normalizedKey, value: normalizedValue }];
  });
};

export const createDynamicRecord = <T>(resolver: () => Record<string, T>): Record<string, T> =>
  new Proxy(
    {},
    {
      get: (_target, prop) => resolver()[String(prop)],
      has: (_target, prop) => prop in resolver(),
      ownKeys: () => Reflect.ownKeys(resolver()),
      getOwnPropertyDescriptor: (_target, prop) => {
        const value = resolver()[String(prop)];
        if (value === undefined) {
          return undefined;
        }

        return {
          configurable: true,
          enumerable: true,
          writable: false,
          value,
        };
      },
    }
  ) as Record<string, T>;

export const getCustomCapabilities = (transport: ProviderTransport): ProviderCapabilities => {
  return transport === 'openai'
    ? CUSTOM_OPENAI_CAPABILITIES
    : CUSTOM_OPENAI_COMPATIBLE_CAPABILITIES;
};

export const getCustomDefaultModel = (transport: ProviderTransport): string => {
  return transport === 'openai' ? 'gpt-5.5' : 'gpt-4.1-mini';
};

export const getCustomDefaultIcon = (transport: ProviderTransport): string => {
  return transport === 'openai' ? 'openai' : 'openai-compatible';
};

export const getCustomProviderLabel = (providerId: string, entry: ProviderConfigEntry): string => {
  const label = entry.label?.trim();
  if (label) {
    return label;
  }

  return providerId;
};

export const listConfiguredModelIds = (
  configuredModels: Record<string, ProviderConfigModelEntry>
): string[] => {
  const next: string[] = [];
  for (const modelId of Object.keys(configuredModels)) {
    const normalizedModelId = modelId.trim();
    if (normalizedModelId && !next.includes(normalizedModelId)) {
      next.push(normalizedModelId);
    }
  }
  return next;
};
