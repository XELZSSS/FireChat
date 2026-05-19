import { ProviderId } from '@/shared/types/chat';
import type { LanguagePreference } from '@/shared/utils/i18n';
import type { AccentPreference, ThemePreference } from '@/shared/utils/theme';
import type { AppFontSize, HttpProtocolPreference, SendShortcut } from '@/shared/utils/appOptions';
import type { PetSettings } from '@client/features/pet/domain/petTypes';
import {
  isPlainObject,
  loadJsonBackedStore,
  persistJsonBackedStore,
  persistJsonBackedStoreAsync,
} from '@/infrastructure/persistence/jsonBackedStore';
import {
  areAppSettingsEqual,
  getDefaultAppSettings,
  normalizeAppSettings,
} from '@/infrastructure/persistence/appSettingsNormalization';

export { getDefaultAppSettings, normalizeAppSettings };

export type AppSettings = {
  defaultProviderId: ProviderId;
  languagePreference: LanguagePreference;
  themePreference: ThemePreference;
  accentPreference: AccentPreference;
  sidebarCollapsed: boolean;
  uiFontFamily: string;
  uiFontSize: AppFontSize;
  sendShortcut: SendShortcut;
  showMessageTimestamps: boolean;
  wrapCodeBlocks: boolean;
  petSettings: PetSettings;
  reduceMotion: boolean;
  closeToTray: boolean;
  minimizeToTray: boolean;
  launchAtStartup: boolean;
  startMinimizedToTray: boolean;
  rememberWindowBounds: boolean;
  toolCallMaxRounds: string;
  httpProtocol: HttpProtocolPreference;
  localProxyHost: string;
  localProxyPort: string;
};

let cachedAppSettings: AppSettings | null = null;

export const loadAppSettings = (): AppSettings => {
  if (cachedAppSettings) {
    return cachedAppSettings;
  }

  const defaults = getDefaultAppSettings();

  cachedAppSettings = loadJsonBackedStore({
    storageKey: 'appSettings',
    emptyValue: defaults,
    normalize: (parsed) => normalizeAppSettings(parsed, defaults),
    shouldPersist: (parsed, normalized) =>
      !isPlainObject(parsed) || !areAppSettingsEqual(normalized, normalizeAppSettings(parsed)),
    persist: persistAppSettings,
    errorLabel: 'Failed to load app settings:',
  });

  return cachedAppSettings;
};

export const persistAppSettings = (settings: AppSettings): AppSettings => {
  cachedAppSettings = persistJsonBackedStore({
    storageKey: 'appSettings',
    value: settings,
    normalize: (value) => normalizeAppSettings(value),
    errorLabel: 'Failed to persist app settings:',
  });

  return cachedAppSettings;
};

export const persistAppSettingsAsync = (settings: AppSettings): Promise<AppSettings> => {
  return persistJsonBackedStoreAsync({
    storageKey: 'appSettings',
    value: settings,
    normalize: (value) => normalizeAppSettings(value),
    errorLabel: 'Failed to persist app settings:',
  }).then((nextSettings) => {
    cachedAppSettings = nextSettings;
    return nextSettings;
  });
};

export const updateAppSettings = (updates: Partial<AppSettings>): AppSettings => {
  return persistAppSettings({
    ...loadAppSettings(),
    ...updates,
  });
};

export const loadDefaultProviderId = (): ProviderId => {
  return loadAppSettings().defaultProviderId;
};

export const persistDefaultProviderId = (providerId: ProviderId): void => {
  updateAppSettings({ defaultProviderId: providerId });
};
