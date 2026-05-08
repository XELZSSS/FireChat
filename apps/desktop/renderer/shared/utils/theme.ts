import { loadAppSettings, updateAppSettings } from '@/infrastructure/persistence/appSettingsStore';

export type Theme = 'dark' | 'light';
export type ThemePreference = Theme;
export type AccentPreference =
  | 'neutral'
  | 'blue'
  | 'indigo'
  | 'sky'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'emerald'
  | 'mint'
  | 'lime'
  | 'yellow'
  | 'amber'
  | 'gold'
  | 'orange'
  | 'coral'
  | 'rose'
  | 'pink'
  | 'magenta'
  | 'fuchsia'
  | 'red'
  | 'crimson'
  | 'purple'
  | 'lavender'
  | 'plum'
  | 'violet';

const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark';
const DEFAULT_ACCENT_PREFERENCE: AccentPreference = 'neutral';
const BACKGROUND_BY_THEME: Record<Theme, string> = {
  dark: '#101010',
  light: '#fbfbfc',
};

const isTheme = (value: unknown): value is Theme => value === 'dark' || value === 'light';

const isThemePreference = (value: unknown): value is ThemePreference => isTheme(value);

const isAccentPreference = (value: unknown): value is AccentPreference =>
  value === 'neutral' ||
  value === 'blue' ||
  value === 'indigo' ||
  value === 'sky' ||
  value === 'cyan' ||
  value === 'teal' ||
  value === 'green' ||
  value === 'emerald' ||
  value === 'mint' ||
  value === 'lime' ||
  value === 'yellow' ||
  value === 'amber' ||
  value === 'gold' ||
  value === 'orange' ||
  value === 'coral' ||
  value === 'rose' ||
  value === 'pink' ||
  value === 'magenta' ||
  value === 'fuchsia' ||
  value === 'red' ||
  value === 'crimson' ||
  value === 'purple' ||
  value === 'lavender' ||
  value === 'plum' ||
  value === 'violet';

const getStoredThemePreference = (): ThemePreference => {
  const value = loadAppSettings().themePreference;
  return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
};

const getStoredAccentPreference = (): AccentPreference => {
  const value = loadAppSettings().accentPreference;
  return isAccentPreference(value) ? value : DEFAULT_ACCENT_PREFERENCE;
};

let currentThemePreference: ThemePreference = getStoredThemePreference();
let currentTheme: Theme = currentThemePreference;
let currentAccentPreference: AccentPreference = getStoredAccentPreference();

export const getTheme = (): Theme => currentTheme;

export const getThemePreference = (): ThemePreference => currentThemePreference;

export const getAccentPreference = (): AccentPreference => currentAccentPreference;

export const applyThemeToDocument = (): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.themePreference = currentThemePreference;
  document.documentElement.dataset.theme = currentTheme;
  document.documentElement.dataset.accent = currentAccentPreference;
  document.documentElement.style.colorScheme = currentTheme;
  document.documentElement.style.backgroundColor = BACKGROUND_BY_THEME[currentTheme];
};

type ThemePreferenceOptions = {
  persist?: boolean;
};

type AccentPreferenceOptions = {
  persist?: boolean;
};

export const setThemePreference = (
  theme: ThemePreference,
  options: ThemePreferenceOptions = {}
): Theme => {
  const { persist = true } = options;
  currentThemePreference = isThemePreference(theme) ? theme : DEFAULT_THEME_PREFERENCE;
  currentTheme = currentThemePreference;
  if (persist) {
    updateAppSettings({ themePreference: currentThemePreference });
  }
  applyThemeToDocument();
  return currentTheme;
};

export const setAccentPreference = (
  accent: AccentPreference,
  options: AccentPreferenceOptions = {}
): AccentPreference => {
  const { persist = true } = options;
  currentAccentPreference = isAccentPreference(accent) ? accent : DEFAULT_ACCENT_PREFERENCE;
  if (persist) {
    updateAppSettings({ accentPreference: currentAccentPreference });
  }
  applyThemeToDocument();
  return currentAccentPreference;
};
