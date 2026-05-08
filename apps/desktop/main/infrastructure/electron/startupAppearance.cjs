const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULT_THEME_PREFERENCE = 'system';
const DEFAULT_ACCENT_PREFERENCE = 'neutral';
const DEFAULT_THEME = 'dark';
const STARTUP_APPEARANCE_FILE = path.join(app.getPath('userData'), 'startup-appearance.json');

const BACKGROUND_BY_THEME = {
  dark: '#101010',
  light: '#fbfbfc',
};

const VALID_THEMES = new Set(['dark', 'light']);
const VALID_THEME_PREFERENCES = new Set(['system', 'dark', 'light']);
const VALID_ACCENTS = new Set([
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

const normalizeTheme = (value) => (VALID_THEMES.has(value) ? value : DEFAULT_THEME);

const normalizeThemePreference = (value) =>
  VALID_THEME_PREFERENCES.has(value) ? value : DEFAULT_THEME_PREFERENCE;

const normalizeAccentPreference = (value) =>
  VALID_ACCENTS.has(value) ? value : DEFAULT_ACCENT_PREFERENCE;

const resolveTheme = (themePreference, systemTheme) =>
  themePreference === 'system' ? normalizeTheme(systemTheme) : normalizeTheme(themePreference);

const normalizeStartupAppearance = (value, systemTheme = DEFAULT_THEME) => {
  const raw = value && typeof value === 'object' ? value : {};
  const themePreference = normalizeThemePreference(raw.themePreference);
  const theme = resolveTheme(themePreference, raw.theme ?? systemTheme);
  const accentPreference = normalizeAccentPreference(raw.accentPreference);

  return {
    runtime: 'electron',
    themePreference,
    theme,
    accentPreference,
    backgroundColor: BACKGROUND_BY_THEME[theme],
  };
};

const parseStoredAppearance = (rawSettings, systemTheme = DEFAULT_THEME) => {
  if (typeof rawSettings !== 'string' || rawSettings.trim() === '') {
    return normalizeStartupAppearance(null, systemTheme);
  }

  return normalizeStartupAppearance(JSON.parse(rawSettings), systemTheme);
};

const readStartupAppearance = (systemTheme = DEFAULT_THEME) => {
  try {
    const raw = fs.readFileSync(STARTUP_APPEARANCE_FILE, 'utf8');
    return parseStoredAppearance(raw, systemTheme);
  } catch {
    return normalizeStartupAppearance({ themePreference: 'dark' }, 'dark');
  }
};

const writeStartupAppearance = (appearance) => {
  const normalized = normalizeStartupAppearance(appearance, DEFAULT_THEME);
  fs.mkdirSync(path.dirname(STARTUP_APPEARANCE_FILE), { recursive: true });
  fs.writeFileSync(
    STARTUP_APPEARANCE_FILE,
    JSON.stringify({
      themePreference: normalized.themePreference,
      theme: normalized.theme,
      accentPreference: normalized.accentPreference,
    }),
    'utf8'
  );

  return normalized;
};

module.exports = {
  BACKGROUND_BY_THEME,
  DEFAULT_ACCENT_PREFERENCE,
  DEFAULT_THEME_PREFERENCE,
  normalizeStartupAppearance,
  parseStoredAppearance,
  readStartupAppearance,
  writeStartupAppearance,
};
