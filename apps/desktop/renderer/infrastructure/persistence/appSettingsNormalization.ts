import type { ProviderId } from '@/shared/types/chat';
import type { LanguagePreference } from '@/shared/utils/i18n';
import type { AccentPreference, ThemePreference } from '@/shared/utils/theme';
import {
  DEFAULT_APP_FONT_SIZE,
  DEFAULT_HTTP_PROTOCOL,
  DEFAULT_SEND_SHORTCUT,
  DEFAULT_UI_FONT_FAMILY,
  isHttpProtocolPreference,
  isAppFontSize,
  isSendShortcut,
  normalizeUiFontFamily,
} from '@/shared/utils/appOptions';
import { getRuntimeEnvValue } from '@/infrastructure/config/runtimeEnv';
import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import {
  DEFAULT_MAX_TOOL_CALL_ROUNDS,
  MAX_TOOL_CALL_ROUNDS,
  MIN_TOOL_CALL_ROUNDS,
} from '@/infrastructure/providers/utils';
import {
  getDefaultAiGatewaySettings,
  normalizeAiGatewaySettings,
} from '@/infrastructure/providers/aiGatewaySettings';
import {
  areCliSettingsEqual,
  getDefaultCliSettings,
  normalizeCliSettings,
} from '@/infrastructure/providers/cliProviderSettings';
import { isPlainObject } from '@/infrastructure/persistence/jsonBackedStore';
import type { AppSettings } from '@/infrastructure/persistence/appSettingsStore';
import {
  arePetSettingsEqual,
  DEFAULT_PET_SETTINGS,
  normalizePetSettings,
} from '@client/features/pet/domain/petDefaults';

const ACCENT_PREFERENCES = new Set<AccentPreference>([
  'neutral',
  'blue',
  'indigo',
  'sky',
  'cyan',
  'teal',
  'green',
  'emerald',
  'mint',
  'lime',
  'yellow',
  'amber',
  'gold',
  'orange',
  'coral',
  'rose',
  'pink',
  'magenta',
  'fuchsia',
  'red',
  'crimson',
  'purple',
  'lavender',
  'plum',
  'violet',
]);

export const areAppSettingsEqual = (left: AppSettings, right: AppSettings): boolean => {
  return (
    left.defaultProviderId === right.defaultProviderId &&
    left.languagePreference === right.languagePreference &&
    left.themePreference === right.themePreference &&
    left.accentPreference === right.accentPreference &&
    left.sidebarCollapsed === right.sidebarCollapsed &&
    left.uiFontFamily === right.uiFontFamily &&
    left.uiFontSize === right.uiFontSize &&
    left.sendShortcut === right.sendShortcut &&
    left.showMessageTimestamps === right.showMessageTimestamps &&
    left.wrapCodeBlocks === right.wrapCodeBlocks &&
    arePetSettingsEqual(left.petSettings, right.petSettings) &&
    left.reduceMotion === right.reduceMotion &&
    left.closeToTray === right.closeToTray &&
    left.minimizeToTray === right.minimizeToTray &&
    left.launchAtStartup === right.launchAtStartup &&
    left.startMinimizedToTray === right.startMinimizedToTray &&
    left.rememberWindowBounds === right.rememberWindowBounds &&
    left.toolCallMaxRounds === right.toolCallMaxRounds &&
    left.httpProtocol === right.httpProtocol &&
    left.localProxyHost === right.localProxyHost &&
    left.localProxyPort === right.localProxyPort &&
    left.aiGateway.enabled === right.aiGateway.enabled &&
    left.aiGateway.gatewayId === right.aiGateway.gatewayId &&
    left.aiGateway.baseUrl === right.aiGateway.baseUrl &&
    left.aiGateway.apiKey === right.aiGateway.apiKey &&
    areCliSettingsEqual(left.cli, right.cli)
  );
};

const normalizeLocalProxyHost = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const normalizeLocalProxyPort = (value: unknown): string | undefined => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    return undefined;
  }

  return String(parsed);
};

const isLanguagePreference = (value: unknown): value is LanguagePreference => {
  return value === 'en' || value === 'zh-CN';
};

const isThemePreference = (value: unknown): value is ThemePreference => {
  return value === 'light' || value === 'dark';
};

const isAccentPreference = (value: unknown): value is AccentPreference => {
  return typeof value === 'string' && ACCENT_PREFERENCES.has(value as AccentPreference);
};

const isProviderId = (value: unknown): value is ProviderId => {
  return typeof value === 'string' && listProviderIds().includes(value as ProviderId);
};

const clampToolCallRounds = (value: number): string => {
  return String(Math.min(Math.max(value, MIN_TOOL_CALL_ROUNDS), MAX_TOOL_CALL_ROUNDS));
};

const normalizeToolCallMaxRounds = (value: unknown): string | undefined => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return clampToolCallRounds(parsed);
};

const resolveDefaultToolCallMaxRounds = (): string =>
  normalizeToolCallMaxRounds(getRuntimeEnvValue('TOOL_CALL_MAX_ROUNDS')) ??
  normalizeToolCallMaxRounds(getRuntimeEnvValue('MAX_TOOL_CALL_ROUNDS')) ??
  String(DEFAULT_MAX_TOOL_CALL_ROUNDS);

export const getDefaultAppSettings = (): AppSettings => {
  const defaultProviderId = listProviderIds()[0] ?? 'openai';

  return {
    defaultProviderId,
    languagePreference: 'zh-CN',
    themePreference: 'dark',
    accentPreference: 'neutral',
    sidebarCollapsed: false,
    uiFontFamily: DEFAULT_UI_FONT_FAMILY,
    uiFontSize: DEFAULT_APP_FONT_SIZE,
    sendShortcut: DEFAULT_SEND_SHORTCUT,
    showMessageTimestamps: true,
    wrapCodeBlocks: false,
    petSettings: DEFAULT_PET_SETTINGS,
    reduceMotion: false,
    closeToTray: true,
    minimizeToTray: false,
    launchAtStartup: false,
    startMinimizedToTray: false,
    rememberWindowBounds: true,
    toolCallMaxRounds: resolveDefaultToolCallMaxRounds(),
    httpProtocol: DEFAULT_HTTP_PROTOCOL,
    localProxyHost: '127.0.0.1',
    localProxyPort: '0',
    aiGateway: getDefaultAiGatewaySettings(),
    cli: getDefaultCliSettings(),
  };
};

export const normalizeAppSettings = (
  value: unknown,
  currentSettings: Partial<AppSettings> = {}
): AppSettings => {
  const defaults = getDefaultAppSettings();
  const raw = isPlainObject(value) ? value : {};

  return {
    defaultProviderId: isProviderId(raw.defaultProviderId)
      ? raw.defaultProviderId
      : (currentSettings.defaultProviderId ?? defaults.defaultProviderId),
    languagePreference: isLanguagePreference(raw.languagePreference)
      ? raw.languagePreference
      : (currentSettings.languagePreference ?? defaults.languagePreference),
    themePreference: isThemePreference(raw.themePreference)
      ? raw.themePreference
      : (currentSettings.themePreference ?? defaults.themePreference),
    accentPreference: isAccentPreference(raw.accentPreference)
      ? raw.accentPreference
      : (currentSettings.accentPreference ?? defaults.accentPreference),
    sidebarCollapsed:
      typeof raw.sidebarCollapsed === 'boolean'
        ? raw.sidebarCollapsed
        : (currentSettings.sidebarCollapsed ?? defaults.sidebarCollapsed),
    uiFontFamily:
      normalizeUiFontFamily(raw.uiFontFamily) ??
      currentSettings.uiFontFamily ??
      defaults.uiFontFamily,
    uiFontSize: isAppFontSize(raw.uiFontSize)
      ? raw.uiFontSize
      : (currentSettings.uiFontSize ?? defaults.uiFontSize),
    sendShortcut: isSendShortcut(raw.sendShortcut)
      ? raw.sendShortcut
      : (currentSettings.sendShortcut ?? defaults.sendShortcut),
    showMessageTimestamps:
      typeof raw.showMessageTimestamps === 'boolean'
        ? raw.showMessageTimestamps
        : (currentSettings.showMessageTimestamps ?? defaults.showMessageTimestamps),
    wrapCodeBlocks:
      typeof raw.wrapCodeBlocks === 'boolean'
        ? raw.wrapCodeBlocks
        : (currentSettings.wrapCodeBlocks ?? defaults.wrapCodeBlocks),
    petSettings: normalizePetSettings(
      raw.petSettings,
      currentSettings.petSettings ?? defaults.petSettings
    ),
    reduceMotion:
      typeof raw.reduceMotion === 'boolean'
        ? raw.reduceMotion
        : (currentSettings.reduceMotion ?? defaults.reduceMotion),
    closeToTray:
      typeof raw.closeToTray === 'boolean'
        ? raw.closeToTray
        : (currentSettings.closeToTray ?? defaults.closeToTray),
    minimizeToTray:
      typeof raw.minimizeToTray === 'boolean'
        ? raw.minimizeToTray
        : (currentSettings.minimizeToTray ?? defaults.minimizeToTray),
    launchAtStartup:
      typeof raw.launchAtStartup === 'boolean'
        ? raw.launchAtStartup
        : (currentSettings.launchAtStartup ?? defaults.launchAtStartup),
    startMinimizedToTray:
      typeof raw.startMinimizedToTray === 'boolean'
        ? raw.startMinimizedToTray
        : (currentSettings.startMinimizedToTray ?? defaults.startMinimizedToTray),
    rememberWindowBounds:
      typeof raw.rememberWindowBounds === 'boolean'
        ? raw.rememberWindowBounds
        : (currentSettings.rememberWindowBounds ?? defaults.rememberWindowBounds),
    toolCallMaxRounds:
      normalizeToolCallMaxRounds(raw.toolCallMaxRounds) ??
      currentSettings.toolCallMaxRounds ??
      defaults.toolCallMaxRounds,
    httpProtocol: isHttpProtocolPreference(raw.httpProtocol)
      ? raw.httpProtocol
      : (currentSettings.httpProtocol ?? defaults.httpProtocol),
    localProxyHost:
      normalizeLocalProxyHost(raw.localProxyHost) ??
      currentSettings.localProxyHost ??
      defaults.localProxyHost,
    localProxyPort:
      normalizeLocalProxyPort(raw.localProxyPort) ??
      currentSettings.localProxyPort ??
      defaults.localProxyPort,
    aiGateway: normalizeAiGatewaySettings(
      raw.aiGateway,
      currentSettings.aiGateway ?? defaults.aiGateway
    ),
    cli: normalizeCliSettings(raw.cli, currentSettings.cli ?? defaults.cli),
  };
};
