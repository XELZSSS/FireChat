import {
  getDefaultAppSettings,
  normalizeAppSettings,
} from '@/infrastructure/persistence/appSettingsStore';
import {
  DEFAULT_INTERFACE_LAYOUT_CONFIG,
  stringifyInterfaceLayoutConfig,
} from '@client/features/settings/infrastructure/interfaceLayoutConfig';
import type { SettingsModalState } from '@client/features/settings/presentation/settingsModal/state/reducer';

export const createDefaultOptionsPatch = () => {
  const defaults = getDefaultAppSettings();

  return {
    languagePreference: defaults.languagePreference,
    themePreference: defaults.themePreference,
    accentPreference: defaults.accentPreference,
    sidebarCollapsed: defaults.sidebarCollapsed,
    uiFontFamily: defaults.uiFontFamily,
    uiFontSize: defaults.uiFontSize,
    sendShortcut: defaults.sendShortcut,
    showMessageTimestamps: defaults.showMessageTimestamps,
    wrapCodeBlocks: defaults.wrapCodeBlocks,
    petSettings: defaults.petSettings,
    reduceMotion: defaults.reduceMotion,
    closeToTray: defaults.closeToTray,
    minimizeToTray: defaults.minimizeToTray,
    launchAtStartup: defaults.launchAtStartup,
    startMinimizedToTray: defaults.startMinimizedToTray,
    rememberWindowBounds: defaults.rememberWindowBounds,
    httpProtocol: defaults.httpProtocol,
    localProxyHost: defaults.localProxyHost,
    localProxyPort: defaults.localProxyPort,
    aiGateway: defaults.aiGateway,
  };
};

export const createDefaultInterfaceLayoutConfigText = (): string =>
  stringifyInterfaceLayoutConfig(DEFAULT_INTERFACE_LAYOUT_CONFIG);

export const createImportedOptionsState = (
  value: unknown,
  currentApp: SettingsModalState['app']
) => {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const app = normalizeAppSettings((record as { app?: unknown }).app, currentApp);
  const interfaceLayout = (record as { interfaceLayout?: unknown }).interfaceLayout;

  return {
    appPatch: {
      languagePreference: app.languagePreference,
      themePreference: app.themePreference,
      accentPreference: app.accentPreference,
      sidebarCollapsed: app.sidebarCollapsed,
      uiFontFamily: app.uiFontFamily,
      uiFontSize: app.uiFontSize,
      sendShortcut: app.sendShortcut,
      showMessageTimestamps: app.showMessageTimestamps,
      wrapCodeBlocks: app.wrapCodeBlocks,
      petSettings: app.petSettings,
      reduceMotion: app.reduceMotion,
      closeToTray: app.closeToTray,
      minimizeToTray: app.minimizeToTray,
      launchAtStartup: app.launchAtStartup,
      startMinimizedToTray: app.startMinimizedToTray,
      rememberWindowBounds: app.rememberWindowBounds,
      httpProtocol: app.httpProtocol,
      localProxyHost: app.localProxyHost,
      localProxyPort: app.localProxyPort,
      aiGateway: app.aiGateway,
    },
    interfaceLayoutConfigText: interfaceLayout
      ? stringifyInterfaceLayoutConfig(interfaceLayout)
      : undefined,
  };
};

