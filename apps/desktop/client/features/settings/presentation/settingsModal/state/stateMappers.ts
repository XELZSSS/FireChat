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
import { pickAppSettingsFields } from '@client/features/settings/domain/appSettingsFields';

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
    apiKey: settings?.apiKey ?? '',
    requestMode: settings?.requestMode,
    baseUrl: resolveBaseUrlForProvider(input.providerId, settings?.baseUrl),
    customHeaders: settings?.customHeaders ?? [],
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
    ...pickAppSettingsFields(appSettings),
  },
  ui: {
    showApiKey: false,
    activeTab: 'provider',
    interfaceLayoutConfigText: stringifyInterfaceLayoutConfig(
      readBootstrappedInterfaceLayoutConfig()
    ),
    providerConfigJsonText: buildProviderJsonText(input.providerId, input.providerSettings),
  },
});



