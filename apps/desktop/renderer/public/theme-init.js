/* global document, window */
(function bootstrapRendererAppearance() {
  var DEFAULT_THEME_PREFERENCE = 'system';
  var DEFAULT_ACCENT_PREFERENCE = 'neutral';
  var DEFAULT_THEME = 'dark';
  var BACKGROUND_BY_THEME = {
    dark: '#1f1f1f',
    light: '#f7f7f7',
  };

  var VALID_THEMES = {
    dark: true,
    light: true,
  };

  var VALID_THEME_PREFERENCES = {
    system: true,
    dark: true,
    light: true,
  };

  var VALID_ACCENTS = {
    neutral: true,
    blue: true,
    indigo: true,
    sky: true,
    cyan: true,
    teal: true,
    green: true,
    emerald: true,
    mint: true,
    lime: true,
    yellow: true,
    amber: true,
    gold: true,
    orange: true,
    coral: true,
    rose: true,
    pink: true,
    magenta: true,
    fuchsia: true,
    red: true,
    crimson: true,
    purple: true,
    lavender: true,
    plum: true,
    violet: true,
  };

  var normalizeThemePreference = function (value) {
    return VALID_THEME_PREFERENCES[value] ? value : DEFAULT_THEME_PREFERENCE;
  };

  var normalizeTheme = function (value) {
    return VALID_THEMES[value] ? value : DEFAULT_THEME;
  };

  var normalizeAccentPreference = function (value) {
    return VALID_ACCENTS[value] ? value : DEFAULT_ACCENT_PREFERENCE;
  };

  var resolveSystemTheme = function () {
    if (typeof window.matchMedia !== 'function') {
      return DEFAULT_THEME;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  var resolveTheme = function (themePreference, systemTheme) {
    return themePreference === 'system'
      ? normalizeTheme(systemTheme)
      : normalizeTheme(themePreference);
  };

  var normalizeAppearance = function (value, runtime) {
    var raw = value && typeof value === 'object' ? value : {};
    var themePreference = normalizeThemePreference(raw.themePreference);
    var theme = resolveTheme(themePreference, resolveSystemTheme());
    var accentPreference = normalizeAccentPreference(raw.accentPreference);

    return {
      runtime: runtime,
      themePreference: themePreference,
      theme: theme,
      accentPreference: accentPreference,
      backgroundColor: BACKGROUND_BY_THEME[theme] || BACKGROUND_BY_THEME.dark,
    };
  };

  var readStoredAppearance = function () {
    try {
      var raw =
        window.firechat && window.firechat.storage
          ? window.firechat.storage.readAppStorage('appSettings')
          : null;
      if (typeof raw !== 'string' || raw.trim() === '') {
        return null;
      }

      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  var applyAppearanceToDocument = function (appearance) {
    var root = document.documentElement;

    root.dataset.runtime = appearance.runtime;
    root.dataset.themePreference = appearance.themePreference;
    root.dataset.theme = appearance.theme;
    root.dataset.accent = appearance.accentPreference;
    root.style.colorScheme = appearance.theme;
    root.style.backgroundColor = appearance.backgroundColor;
  };

  try {
    var runtime = window.firechat ? 'electron' : 'web';
    var storedAppSettings = readStoredAppearance();
    applyAppearanceToDocument(normalizeAppearance(storedAppSettings, runtime));
  } catch {
    applyAppearanceToDocument(normalizeAppearance(null, window.firechat ? 'electron' : 'web'));
  }
})();
