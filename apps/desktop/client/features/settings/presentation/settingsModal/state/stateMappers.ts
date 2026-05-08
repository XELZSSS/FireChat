import { ProviderId } from '@/shared/types/chat';
import type { LanguagePreference } from '@/shared/utils/i18n';
import type { AccentPreference, ThemePreference } from '@/shared/utils/theme';
import { loadAppSettings } from '@/infrastructure/persistence/appSettingsStore';
import type { ProviderSettings } from '@/infrastructure/providers/defaults';
import type { SettingsModalState } from '@client/features/settings/presentation/settingsModal/state/reducer';
import { resolveBaseUrlForProvider } from '@/infrastructure/providers/config/baseUrl';
import { createDefaultOpenAdapterToolSettings } from '@/infrastructure/providers/openadapterToolConfig';
import { resolveSettingsTabForProvider } from '@client/features/settings/presentation/settingsModal/sections/providerCatalog';
import {
  readBootstrappedInterfaceLayoutConfig,
  stringifyInterfaceLayoutConfig,
} from '@client/features/settings/infrastructure/interfaceLayoutConfig';
import { buildProviderJsonText } from '@client/features/settings/infrastructure/providerJsonConfig';

export type ProviderStateInput = {
  providerId: ProviderId;
  providerSettings?: Partial<ProviderSettings>;
};

export type BuildStateInput = ProviderStateInput & {
  activeTabProviderId?: ProviderId;
  languagePreference: LanguagePreference;
  themePreference: ThemePreference;
  accentPreference: AccentPreference;
};

export const buildProviderStateInput = (
  providerId: ProviderId,
  providerSettings?: Partial<ProviderSettings>
): ProviderStateInput => ({
  providerId,
  providerSettings,
});

export const buildProviderState = (input: ProviderStateInput): SettingsModalState['provider'] => {
  const settings = input.providerSettings;

  return {
    providerId: input.providerId,
    modelName: settings?.modelName ?? '',
    systemPrompt: settings?.systemPrompt ?? '',
    imageModelName: settings?.imageModelName ?? '',
    imageGeneration: settings?.imageGeneration,
    apiKey: settings?.apiKey ?? '',
    requestMode: settings?.requestMode,
    baseUrl: resolveBaseUrlForProvider(input.providerId, settings?.baseUrl),
    customHeaders: settings?.customHeaders ?? [],
    tavily: settings?.tavily ?? {},
    openAdapterTools: settings?.openAdapterTools ?? createDefaultOpenAdapterToolSettings(),
  };
};

export const buildProviderSelectionState = (
  providerId: ProviderId,
  providerSettings?: Partial<ProviderSettings>
): Pick<SettingsModalState, 'provider'> & {
  ui: Pick<SettingsModalState['ui'], 'providerConfigJsonText'>;
} => ({
  provider: buildProviderState(buildProviderStateInput(providerId, providerSettings)),
  ui: {
    providerConfigJsonText: buildProviderJsonText(providerId, providerSettings),
  },
});

export const buildSettingsModalState = (
  input: BuildStateInput,
  appSettings: ReturnType<typeof loadAppSettings>
): SettingsModalState => ({
  provider: buildProviderState(buildProviderStateInput(input.providerId, input.providerSettings)),
  app: {
    defaultProviderId: appSettings.defaultProviderId,
    languagePreference: appSettings.languagePreference,
    themePreference: appSettings.themePreference,
    accentPreference: appSettings.accentPreference,
    sidebarCollapsed: appSettings.sidebarCollapsed,
    uiFontFamily: appSettings.uiFontFamily,
    uiFontSize: appSettings.uiFontSize,
    sendShortcut: appSettings.sendShortcut,
    showMessageTimestamps: appSettings.showMessageTimestamps,
    wrapCodeBlocks: appSettings.wrapCodeBlocks,
    petSettings: appSettings.petSettings,
    reduceMotion: appSettings.reduceMotion,
    closeToTray: appSettings.closeToTray,
    minimizeToTray: appSettings.minimizeToTray,
    launchAtStartup: appSettings.launchAtStartup,
    startMinimizedToTray: appSettings.startMinimizedToTray,
    rememberWindowBounds: appSettings.rememberWindowBounds,
    toolCallMaxRounds: appSettings.toolCallMaxRounds,
    httpProtocol: appSettings.httpProtocol,
    localProxyHost: appSettings.localProxyHost,
    localProxyPort: appSettings.localProxyPort,
    aiGateway: appSettings.aiGateway,
    cli: appSettings.cli,
  },
  ui: {
    showApiKey: false,
    showTavilyKey: false,
    activeTab: resolveSettingsTabForProvider(input.providerId),
    interfaceLayoutConfigText: stringifyInterfaceLayoutConfig(
      readBootstrappedInterfaceLayoutConfig()
    ),
    providerConfigJsonText: buildProviderJsonText(input.providerId, input.providerSettings),
  },
});

export const buildComparableSettingsStateSnapshot = (
  state: SettingsModalState
): Pick<SettingsModalState, 'provider'> & {
  app: Omit<SettingsModalState['app'], 'cli'>;
  ui: Pick<SettingsModalState['ui'], 'interfaceLayoutConfigText' | 'providerConfigJsonText'>;
} => {
  const { cli: _cli, ...app } = state.app;

  return {
    provider: state.provider,
    app,
    ui: {
      interfaceLayoutConfigText: state.ui.interfaceLayoutConfigText,
      providerConfigJsonText: state.ui.providerConfigJsonText,
    },
  };
};

