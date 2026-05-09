import type { AppSettings } from '@/infrastructure/persistence/appSettingsStore';

export const APP_SETTINGS_FIELD_KEYS = [
  'languagePreference',
  'themePreference',
  'accentPreference',
  'sidebarCollapsed',
  'uiFontFamily',
  'uiFontSize',
  'sendShortcut',
  'showMessageTimestamps',
  'wrapCodeBlocks',
  'petSettings',
  'reduceMotion',
  'closeToTray',
  'minimizeToTray',
  'launchAtStartup',
  'startMinimizedToTray',
  'rememberWindowBounds',
  'toolCallMaxRounds',
  'httpProtocol',
  'localProxyHost',
  'localProxyPort',
  'aiGateway',
] as const;

export type AppSettingsFieldKey = (typeof APP_SETTINGS_FIELD_KEYS)[number];

export const pickAppSettingsFields = (
  source: AppSettings
): Pick<AppSettings, AppSettingsFieldKey> => {
  const result: Record<string, unknown> = {};
  for (const key of APP_SETTINGS_FIELD_KEYS) {
    result[key] = source[key];
  }
  return result as Pick<AppSettings, AppSettingsFieldKey>;
};