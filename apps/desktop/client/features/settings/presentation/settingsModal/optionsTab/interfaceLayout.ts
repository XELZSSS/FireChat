import {
  DEFAULT_INTERFACE_LAYOUT_CONFIG,
  parseInterfaceLayoutConfigText,
  type InterfaceLayoutConfig,
} from '@client/features/settings/infrastructure/interfaceLayoutConfig';

export const getInterfaceLayoutConfig = (value: string): InterfaceLayoutConfig => {
  try {
    return parseInterfaceLayoutConfigText(value);
  } catch {
    return DEFAULT_INTERFACE_LAYOUT_CONFIG;
  }
};
