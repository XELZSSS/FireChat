import { jsonSchema, tool } from 'ai';
import type { OpenAdapterToolSettings } from '@/infrastructure/providers/openadapterToolConfig';
import { openadapterFetch } from '@/infrastructure/network/openadapterRuntimeFetch';
import { OPENADAPTER_TOOL_DEFINITIONS } from '@/infrastructure/providers/openadapterToolRegistry';
import { t } from '@/shared/utils/i18n';

const OPENADAPTER_API_ORIGIN = 'https://api.openadapter.in';

const extractErrorMessage = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;
  return (
    extractErrorMessage(record.error) ||
    extractErrorMessage(record.message) ||
    extractErrorMessage(record.detail) ||
    ''
  );
};

const tryParseJson = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
};

const callOpenAdapterTool = async (
  apiKey: string,
  path: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<unknown> => {
  const response = await openadapterFetch(`${OPENADAPTER_API_ORIGIN}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  const raw = await response.text();
  const parsed = raw.trim() ? tryParseJson(raw) : {};

  if (!response.ok) {
    const message = extractErrorMessage(parsed);
    throw new Error(message || `${t('settings.search.error.requestFailed')}: ${response.status}`);
  }

  return parsed;
};

const getMissingFieldError = (requiredField: 'query' | 'url') =>
  requiredField === 'query'
    ? t('settings.provider.error.tool.missingQuery')
    : t('settings.provider.error.tool.missingUrl');

export const buildOpenAdapterToolSet = ({
  apiKey,
  searchEnabled,
  toolSettings,
}: {
  apiKey?: string;
  searchEnabled: boolean;
  toolSettings: OpenAdapterToolSettings;
}): Record<string, unknown> | undefined => {
  if (!searchEnabled || !apiKey) {
    return undefined;
  }

  const tools = Object.fromEntries(
    OPENADAPTER_TOOL_DEFINITIONS.filter((definition) => toolSettings[definition.key]).map(
      (definition) => [
        definition.runtimeName,
        tool({
          description: definition.runtimeDescription,
          inputSchema: jsonSchema(definition.parameters as any),
          execute: async (
            input: Record<string, unknown> = {},
            options?: { abortSignal?: AbortSignal }
          ) => {
            const requestBody = definition.buildRequestBody(input);
            if (!requestBody) {
              return { error: getMissingFieldError(definition.requiredField) };
            }

            return await callOpenAdapterTool(
              apiKey,
              definition.endpoint,
              requestBody,
              options?.abortSignal
            );
          },
        } as any),
      ]
    )
  );

  return Object.keys(tools).length > 0 ? tools : undefined;
};
