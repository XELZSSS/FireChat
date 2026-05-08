import type { ProviderSettings } from '@/infrastructure/providers/defaults';
import type {
  ProviderSettingsMap,
  SaveSettingsPayload,
} from '@client/features/settings/domain/settingsTypes';
import type { getDesktopInterfaceLayoutConfig } from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import { areComparableValuesEqual } from '@/shared/utils/comparable';
import { getCachedProviderModels } from '@/infrastructure/providers/modelCatalog';
import {
  getCurrentProviderFileSnapshot,
  persistProviderRuntimeState,
} from '@/infrastructure/providers/runtime/providerRuntimeSync';
import { loadAppSettings, type AppSettings } from '@/infrastructure/persistence/appSettingsStore';
import {
  parseInterfaceLayoutConfigText,
  type InterfaceLayoutConfig,
} from '@client/features/settings/infrastructure/interfaceLayoutConfig';
import { buildProviderSnapshotFromJsonText } from '@client/features/settings/infrastructure/providerJsonConfig';

export type SaveSettingsTransactionContext = {
  previousProviderFileSnapshot: ReturnType<typeof getCurrentProviderFileSnapshot>;
  nextProviderFileSnapshot: Awaited<Parameters<typeof persistProviderRuntimeState>[0]>;
  previousAppSettings: AppSettings;
  previousProviderSettings: ProviderSettings | undefined;
  previousInterfaceLayoutConfig: Awaited<ReturnType<typeof getDesktopInterfaceLayoutConfig>>;
  nextInterfaceLayoutConfig: InterfaceLayoutConfig;
  providerFileSnapshotChanged: boolean;
  appSettingsChanged: boolean;
  providerSettingsChanged: boolean;
  interfaceLayoutChanged: boolean;
  proxyChanged: boolean;
  windowBehaviorChanged: boolean;
  cliChanged: boolean;
};

const buildComparableProviderSettingsSnapshot = (
  settings: Partial<ProviderSettings> | undefined
) => ({
  modelName: settings?.modelName ?? '',
  systemPrompt: settings?.systemPrompt ?? '',
  imageModelName: settings?.imageModelName ?? '',
  imageGeneration: settings?.imageGeneration ?? {},
  requestMode: settings?.requestMode,
  apiKey: settings?.apiKey ?? '',
  baseUrl: settings?.baseUrl ?? '',
  customHeaders: settings?.customHeaders ?? [],
  tavily: settings?.tavily ?? {},
  openAdapterTools: settings?.openAdapterTools ?? {},
});

const haveProviderSettingsChanged = (
  previousSettings: ProviderSettings | undefined,
  nextSettings: ProviderSettings
): boolean =>
  !areComparableValuesEqual(
    buildComparableProviderSettingsSnapshot(previousSettings),
    buildComparableProviderSettingsSnapshot(nextSettings)
  );

export const createSaveSettingsTransactionContext = async (
  value: SaveSettingsPayload,
  providerSettings: ProviderSettingsMap,
  previousInterfaceLayoutConfig: Awaited<ReturnType<typeof getDesktopInterfaceLayoutConfig>>
): Promise<SaveSettingsTransactionContext> => {
  const previousProviderFileSnapshot = getCurrentProviderFileSnapshot();
  const previousAppSettings = loadAppSettings();
  const previousProviderSettings = providerSettings[value.providerId];
  const providerSnapshot = buildProviderSnapshotFromJsonText({
    snapshot: previousProviderFileSnapshot,
    providerId: value.providerId,
    providerSettings: value.providerSettings,
    availableModels: getCachedProviderModels(value.providerId),
    providerJsonText: value.providerConfigJsonText,
  });
  const nextProviderFileSnapshot = providerSnapshot;
  const nextInterfaceLayoutConfig = parseInterfaceLayoutConfigText(value.interfaceLayoutConfigText);

  return {
    previousProviderFileSnapshot,
    nextProviderFileSnapshot,
    previousAppSettings,
    previousProviderSettings,
    previousInterfaceLayoutConfig,
    nextInterfaceLayoutConfig,
    providerFileSnapshotChanged: !areComparableValuesEqual(
      previousProviderFileSnapshot,
      nextProviderFileSnapshot
    ),
    appSettingsChanged: !areComparableValuesEqual(previousAppSettings, value.app),
    providerSettingsChanged: haveProviderSettingsChanged(
      previousProviderSettings,
      value.providerSettings
    ),
    interfaceLayoutChanged: !areComparableValuesEqual(
      previousInterfaceLayoutConfig,
      nextInterfaceLayoutConfig
    ),
    proxyChanged:
      previousAppSettings.localProxyHost !== value.app.localProxyHost ||
      previousAppSettings.localProxyPort !== value.app.localProxyPort,
    windowBehaviorChanged:
      previousAppSettings.closeToTray !== value.app.closeToTray ||
      previousAppSettings.minimizeToTray !== value.app.minimizeToTray ||
      previousAppSettings.launchAtStartup !== value.app.launchAtStartup ||
      previousAppSettings.startMinimizedToTray !== value.app.startMinimizedToTray ||
      previousAppSettings.rememberWindowBounds !== value.app.rememberWindowBounds,
    cliChanged: !areComparableValuesEqual(previousAppSettings.cli, value.app.cli),
  };
};
