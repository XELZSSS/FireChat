export {
  OPENADAPTER_TOOL_DEFINITIONS,
  OPENADAPTER_TOOL_SETTING_KEYS,
  type OpenAdapterToolKey,
} from '@/infrastructure/providers/openadapterToolRegistry';

import {
  OPENADAPTER_TOOL_DEFINITIONS,
  OPENADAPTER_TOOL_SETTING_KEYS,
  type OpenAdapterToolKey,
} from '@/infrastructure/providers/openadapterToolRegistry';

export type OpenAdapterToolSettings = Record<OpenAdapterToolKey, boolean>;

export const createDefaultOpenAdapterToolSettings = (): OpenAdapterToolSettings =>
  ({
    ...Object.fromEntries(
      OPENADAPTER_TOOL_DEFINITIONS.map((definition) => [definition.key, definition.defaultEnabled])
    ),
  }) as OpenAdapterToolSettings;

export const normalizeOpenAdapterToolSettings = (value: unknown): OpenAdapterToolSettings => {
  const defaults = createDefaultOpenAdapterToolSettings();
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaults;
  }

  const record = value as Partial<Record<OpenAdapterToolKey, unknown>>;
  const normalized = { ...defaults };

  for (const key of OPENADAPTER_TOOL_SETTING_KEYS) {
    if (typeof record[key] === 'boolean') {
      normalized[key] = record[key];
    }
  }

  return normalized;
};

export const hasEnabledOpenAdapterTools = (value: unknown): boolean => {
  const settings = normalizeOpenAdapterToolSettings(value);
  return OPENADAPTER_TOOL_SETTING_KEYS.some((key) => settings[key]);
};
