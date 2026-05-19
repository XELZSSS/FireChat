import {
  getDefaultAppSettings,
  normalizeAppSettings,
} from '@/infrastructure/persistence/appSettingsStore';
import {
  DEFAULT_INTERFACE_LAYOUT_CONFIG,
  stringifyInterfaceLayoutConfig,
} from '@client/features/settings/infrastructure/interfaceLayoutConfig';
import type { SettingsModalState } from '@client/features/settings/presentation/settingsModal/state/reducer';
import { pickAppSettingsFields } from '@client/features/settings/domain/appSettingsFields';

export const createDefaultOptionsPatch = () => {
  const defaults = getDefaultAppSettings();

  return pickAppSettingsFields(defaults);
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
    appPatch: pickAppSettingsFields(app),
    interfaceLayoutConfigText: interfaceLayout
      ? stringifyInterfaceLayoutConfig(interfaceLayout)
      : undefined,
  };
};
