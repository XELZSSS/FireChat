import type { OpenAIRequestMode } from '@/infrastructure/providers/types';

export const trimText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

export const normalizeHeaderEntries = (
  value: Record<string, string> | undefined
): Array<{ key: string; value: string }> => {
  return Object.entries(value ?? {}).flatMap(([key, headerValue]) => {
    const normalizedKey = key.trim();
    const normalizedValue = headerValue.trim();
    if (!normalizedKey || !normalizedValue) {
      return [];
    }

    return [{ key: normalizedKey, value: normalizedValue }];
  });
};

export const buildHeadersRecord = (
  headers: Array<{ key: string; value: string }> | undefined
): Record<string, string> => {
  return Object.fromEntries(
    (headers ?? []).flatMap((header) => {
      const key = header.key.trim();
      const value = header.value.trim();
      if (!key || !value) {
        return [];
      }

      return [[key, value]];
    })
  );
};

export const normalizeRequestMode = (value: unknown): OpenAIRequestMode | undefined => {
  return value === 'responses' || value === 'chat_completions' ? value : undefined;
};

export const normalizeProviderJsonId = (value: string): string => value.trim().toLowerCase();
