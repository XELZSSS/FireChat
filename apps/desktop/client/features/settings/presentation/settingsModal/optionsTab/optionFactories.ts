import {
  FONT_FAMILY_PRESETS,
  type AppFontSize,
  type HttpProtocolPreference,
  type SendShortcut,
} from '@/shared/utils/appOptions';
import { t } from '@/shared/utils/i18n';
import { CUSTOM_FONT_PRESET_VALUE } from '@client/features/settings/presentation/settingsModal/optionsTab/constants';

const buildOptions = <T extends string>(items: Array<[T, string]>) =>
  items.map(([value, labelKey]) => ({ value, label: t(labelKey) }));

export const buildFontSizeOptions = () =>
  buildOptions<AppFontSize>([
    ['small', 'settings.options.uiFontSize.small'],
    ['medium', 'settings.options.uiFontSize.medium'],
    ['large', 'settings.options.uiFontSize.large'],
    ['xlarge', 'settings.options.uiFontSize.xlarge'],
  ]);

export const buildSendShortcutOptions = () =>
  buildOptions<SendShortcut>([
    ['enter', 'settings.options.sendShortcut.enter'],
    ['ctrl_enter', 'settings.options.sendShortcut.ctrlEnter'],
    ['alt_enter', 'settings.options.sendShortcut.altEnter'],
    ['meta_enter', 'settings.options.sendShortcut.metaEnter'],
  ]);

export const buildHttpProtocolOptions = () =>
  buildOptions<HttpProtocolPreference>([
    ['http1', 'settings.options.httpProtocol.http1'],
    ['http2', 'settings.options.httpProtocol.http2'],
  ]);

export const buildFontPresetOptions = () => [
  ...FONT_FAMILY_PRESETS.map((preset) => ({
    value: preset.value,
    label: preset.label,
  })),
  {
    value: CUSTOM_FONT_PRESET_VALUE,
    label: t('settings.options.uiFontPreset.custom'),
  },
];

export const isPresetFontFamily = (value: string): boolean =>
  FONT_FAMILY_PRESETS.some((preset) => preset.value === value);
