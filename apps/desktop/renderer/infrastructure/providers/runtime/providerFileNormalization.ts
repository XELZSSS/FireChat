import type {
  ProviderAuthEntry,
  ProviderAuthFile,
  ProviderConfigEntry,
  ProviderConfigFile,
  ProviderConfigModelEntry,
  ProviderFileSnapshot,
  ProviderTransport,
} from '@contracts/provider-config';
import { isPlainObject } from '@/shared/utils/plainObject';

export const EMPTY_PROVIDER_FILE_SNAPSHOT: ProviderFileSnapshot = {
  config: { providers: {} },
  auth: { providers: {} },
};

const normalizeProviderRecord = <T extends object>(value: unknown): Record<string, T> => {
  if (!isPlainObject(value)) {
    return {};
  }

  const next: Record<string, T> = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = key.trim();
    if (!normalizedKey || !isPlainObject(entry)) {
      continue;
    }

    next[normalizedKey] = entry as T;
  }

  return next;
};

const normalizeProviderConfigEntry = (value: unknown): ProviderConfigEntry => {
  if (!isPlainObject(value)) {
    return {};
  }

  const entry = value as Record<string, unknown>;
  const models = normalizeProviderRecord<ProviderConfigModelEntry>(entry.models);

  return {
    source: entry.source === 'builtin' || entry.source === 'custom' ? entry.source : undefined,
    transport:
      entry.transport === 'openai' || entry.transport === 'openai-compatible'
        ? (entry.transport as ProviderTransport)
        : undefined,
    label: typeof entry.label === 'string' ? entry.label : undefined,
    enabled: typeof entry.enabled === 'boolean' ? entry.enabled : undefined,
    icon: typeof entry.icon === 'string' ? entry.icon : undefined,
    defaultModel: typeof entry.defaultModel === 'string' ? entry.defaultModel : undefined,
    options: isPlainObject(entry.options)
      ? {
          baseURL: typeof entry.options.baseURL === 'string' ? entry.options.baseURL : undefined,
          requestMode:
            entry.options.requestMode === 'responses' ||
            entry.options.requestMode === 'chat_completions'
              ? entry.options.requestMode
              : undefined,
          systemPrompt:
            typeof entry.options.systemPrompt === 'string' ? entry.options.systemPrompt : undefined,
        }
      : undefined,
    models,
  };
};

const normalizeProviderAuthEntry = (value: unknown): ProviderAuthEntry => {
  if (!isPlainObject(value)) {
    return {};
  }

  const entry = value as Record<string, unknown>;
  const rawHeaders = isPlainObject(entry.headers) ? entry.headers : {};
  const headers: Record<string, string> = {};
  for (const [key, headerValue] of Object.entries(rawHeaders)) {
    const normalizedKey = key.trim();
    const normalizedValue = typeof headerValue === 'string' ? headerValue.trim() : '';
    if (normalizedKey && normalizedValue) {
      headers[normalizedKey] = normalizedValue;
    }
  }

  return {
    apiKey: typeof entry.apiKey === 'string' ? entry.apiKey : undefined,
    headers,
  };
};

const normalizeProviderConfigFile = (value: unknown): ProviderConfigFile => {
  const next = isPlainObject(value) ? { ...value } : {};
  const providers = normalizeProviderRecord<ProviderConfigEntry>(
    value && (value as Record<string, unknown>).providers
  );
  next.providers = Object.fromEntries(
    Object.entries(providers).map(([key, entry]) => [key, normalizeProviderConfigEntry(entry)])
  );
  return next;
};

const normalizeProviderAuthFile = (value: unknown): ProviderAuthFile => {
  const next = isPlainObject(value) ? { ...value } : {};
  const providers = normalizeProviderRecord<ProviderAuthEntry>(
    value && (value as Record<string, unknown>).providers
  );
  next.providers = Object.fromEntries(
    Object.entries(providers).map(([key, entry]) => [key, normalizeProviderAuthEntry(entry)])
  );
  return next;
};

export const normalizeProviderFileSnapshot = (value: unknown): ProviderFileSnapshot => {
  if (!isPlainObject(value)) {
    return EMPTY_PROVIDER_FILE_SNAPSHOT;
  }

  return {
    config: normalizeProviderConfigFile(value.config),
    auth: normalizeProviderAuthFile(value.auth),
  };
};
