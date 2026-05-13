export type AppFontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type SendShortcut = 'enter' | 'ctrl_enter' | 'alt_enter' | 'meta_enter';
export type HttpProtocolPreference = 'http1' | 'http2';

export const DEFAULT_UI_FONT_FAMILY =
  "'FireChat UI', 'Microsoft YaHei UI', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', 'Noto Sans SC', 'Source Han Sans SC', 'Segoe UI Variable Text', 'Segoe UI Variable', 'Segoe UI', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
export const DEFAULT_APP_FONT_SIZE: AppFontSize = 'medium';
export const DEFAULT_SEND_SHORTCUT: SendShortcut = 'enter';
export const DEFAULT_HTTP_PROTOCOL: HttpProtocolPreference = 'http1';

const FONT_SIZE_VARS: Record<
  AppFontSize,
  {
    small: string;
    base: string;
    large: string;
    xLarge: string;
  }
> = {
  small: {
    small: '0.75rem',
    base: '0.8125rem',
    large: '0.9375rem',
    xLarge: '1.125rem',
  },
  medium: {
    small: '0.8125rem',
    base: '0.875rem',
    large: '1rem',
    xLarge: '1.25rem',
  },
  large: {
    small: '0.875rem',
    base: '0.9375rem',
    large: '1.0625rem',
    xLarge: '1.3125rem',
  },
  xlarge: {
    small: '0.9375rem',
    base: '1rem',
    large: '1.125rem',
    xLarge: '1.375rem',
  },
};

export const FONT_FAMILY_PRESETS = [
  {
    value: DEFAULT_UI_FONT_FAMILY,
    label: 'Unified UI',
  },
  {
    value:
      "'Microsoft YaHei UI', 'Microsoft YaHei', 'Segoe UI Variable Text', 'Segoe UI Variable', 'Segoe UI', sans-serif",
    label: 'Microsoft YaHei UI',
  },
  {
    value: "'PingFang SC', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
    label: 'PingFang SC',
  },
  {
    value: "'Noto Sans CJK SC', 'Noto Sans SC', 'Segoe UI Variable Text', 'Segoe UI', sans-serif",
    label: 'Noto Sans SC',
  },
  {
    value:
      "'Source Han Sans SC', 'Microsoft YaHei UI', 'Segoe UI Variable Text', 'Segoe UI', sans-serif",
    label: 'Source Han Sans SC',
  },
] as const;

export const isAppFontSize = (value: unknown): value is AppFontSize =>
  value === 'small' || value === 'medium' || value === 'large' || value === 'xlarge';

export const isSendShortcut = (value: unknown): value is SendShortcut =>
  value === 'enter' || value === 'ctrl_enter' || value === 'alt_enter' || value === 'meta_enter';

export const isHttpProtocolPreference = (value: unknown): value is HttpProtocolPreference =>
  value === 'http1' || value === 'http2';

export const normalizeUiFontFamily = (value: unknown): string => {
  if (typeof value !== 'string') {
    return DEFAULT_UI_FONT_FAMILY;
  }

  const trimmed = value.trim();
  return trimmed || DEFAULT_UI_FONT_FAMILY;
};

export const applyAppOptionsToDocument = ({
  uiFontFamily,
  uiFontSize,
  reduceMotion,
}: {
  uiFontFamily: string;
  uiFontSize: AppFontSize;
  reduceMotion: boolean;
}): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const fontVars = FONT_SIZE_VARS[uiFontSize];

  root.style.setProperty('--font-family-ui', normalizeUiFontFamily(uiFontFamily));
  root.style.setProperty('--font-size-small', fontVars.small);
  root.style.setProperty('--font-size-base', fontVars.base);
  root.style.setProperty('--font-size-large', fontVars.large);
  root.style.setProperty('--font-size-x-large', fontVars.xLarge);
  root.dataset.motion = reduceMotion ? 'reduced' : 'normal';
};
