export type InterfaceLayoutField =
  | 'language'
  | 'theme'
  | 'accent'
  | 'uiFontPreset'
  | 'uiFontSize'
  | 'uiFontCustom'
  | 'reduceMotion'
  | 'sidebarCollapsed';

export type InterfaceLayoutConfig = {
  schemaVersion: 1;
  availableFields: InterfaceLayoutField[];
  interfaceCard: InterfaceLayoutField[][];
  fontCss: string[];
  colorCss: string[];
};

const INTERFACE_LAYOUT_FIELD_LIST: InterfaceLayoutField[] = [
  'language',
  'theme',
  'accent',
  'uiFontPreset',
  'uiFontSize',
  'uiFontCustom',
  'reduceMotion',
  'sidebarCollapsed',
];

const DEFAULT_FONT_CSS = [
  ':root {',
  "  --font-family-ui-default: 'FireChat UI', 'Microsoft YaHei UI', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', 'Noto Sans SC', 'Source Han Sans SC', 'Segoe UI Variable Text', 'Segoe UI Variable', 'Segoe UI', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;",
  '  --font-family-latin: var(--font-family-ui-default);',
  '  --font-family-cjk: var(--font-family-ui-default);',
  '  --font-family-ui: var(--font-family-ui-default);',
  '}',
];

const DEFAULT_COLOR_CSS = [
  ':root {',
  '  --accent: var(--action-primary);',
  '  --accent-strong: var(--action-primary-strong);',
  '  --text-on-accent: var(--text-on-interactive);',
  '}',
];

export const DEFAULT_INTERFACE_LAYOUT_CONFIG: InterfaceLayoutConfig = {
  schemaVersion: 1,
  availableFields: INTERFACE_LAYOUT_FIELD_LIST,
  interfaceCard: [
    ['language', 'theme'],
    ['accent'],
    ['uiFontPreset', 'uiFontSize'],
    ['uiFontCustom'],
    ['reduceMotion'],
    ['sidebarCollapsed'],
  ],
  fontCss: DEFAULT_FONT_CSS,
  colorCss: DEFAULT_COLOR_CSS,
};

const INTERFACE_LAYOUT_FIELDS = new Set<InterfaceLayoutField>(INTERFACE_LAYOUT_FIELD_LIST);

const FONT_STYLE_ELEMENT_ID = 'firechat-interface-font-css';
const COLOR_STYLE_ELEMENT_ID = 'firechat-interface-color-css';

let cachedInterfaceLayoutConfig: InterfaceLayoutConfig | null = null;

const normalizeCssLines = (value: unknown, defaultLines: string[]): string[] => {
  if (Array.isArray(value)) {
    const lines = value.filter((item): item is string => typeof item === 'string');
    return lines.length > 0 ? lines : defaultLines;
  }

  if (typeof value === 'string') {
    const lines = value.split(/\r?\n/).map((line) => line.replace(/\r/g, ''));
    return lines.some((line) => line.trim().length > 0) ? lines : defaultLines;
  }

  return defaultLines;
};

const normalizeInterfaceLayoutRows = (value: unknown): InterfaceLayoutField[][] => {
  const rows = Array.isArray(value) ? value : [];
  const seenFields = new Set<InterfaceLayoutField>();

  return rows
    .map((row) => {
      if (!Array.isArray(row)) {
        return [];
      }

      return row.filter((item): item is InterfaceLayoutField => {
        if (
          typeof item !== 'string' ||
          !INTERFACE_LAYOUT_FIELDS.has(item as InterfaceLayoutField) ||
          seenFields.has(item as InterfaceLayoutField)
        ) {
          return false;
        }

        seenFields.add(item as InterfaceLayoutField);
        return true;
      });
    })
    .filter((row) => row.length > 0);
};

export const normalizeInterfaceLayoutConfig = (value: unknown): InterfaceLayoutConfig => {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const rows = normalizeInterfaceLayoutRows((record as { interfaceCard?: unknown }).interfaceCard);

  return {
    schemaVersion: 1,
    availableFields: INTERFACE_LAYOUT_FIELD_LIST,
    interfaceCard:
      rows.length > 0 ? rows : DEFAULT_INTERFACE_LAYOUT_CONFIG.interfaceCard.map((row) => [...row]),
    fontCss: normalizeCssLines((record as { fontCss?: unknown }).fontCss, DEFAULT_FONT_CSS),
    colorCss: normalizeCssLines((record as { colorCss?: unknown }).colorCss, DEFAULT_COLOR_CSS),
  };
};

export const parseInterfaceLayoutConfigText = (value: string): InterfaceLayoutConfig => {
  return normalizeInterfaceLayoutConfig(JSON.parse(value));
};

export const stringifyInterfaceLayoutConfig = (value: unknown): string => {
  return `${JSON.stringify(normalizeInterfaceLayoutConfig(value), null, 2)}\n`;
};

const ensureStyleElement = (id: string): HTMLStyleElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const existing = document.getElementById(id);
  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const element = document.createElementNS(
    'http://www.w3.org/1999/xhtml',
    'style'
  ) as HTMLStyleElement;
  element.id = id;
  document.head.appendChild(element);
  return element;
};

export const applyInterfaceLayoutConfigToDocument = (value: unknown): InterfaceLayoutConfig => {
  const config = normalizeInterfaceLayoutConfig(value);
  cachedInterfaceLayoutConfig = config;

  const fontStyle = ensureStyleElement(FONT_STYLE_ELEMENT_ID);
  const colorStyle = ensureStyleElement(COLOR_STYLE_ELEMENT_ID);

  if (fontStyle) {
    fontStyle.textContent = `${config.fontCss.join('\n')}\n`;
  }

  if (colorStyle) {
    colorStyle.textContent = `${config.colorCss.join('\n')}\n`;
  }

  return config;
};

export const readBootstrappedInterfaceLayoutConfig = (): InterfaceLayoutConfig => {
  if (cachedInterfaceLayoutConfig) {
    return cachedInterfaceLayoutConfig;
  }

  if (typeof window === 'undefined' || !window.firechat?.config?.interfaceLayout) {
    cachedInterfaceLayoutConfig = DEFAULT_INTERFACE_LAYOUT_CONFIG;
    return cachedInterfaceLayoutConfig;
  }

  cachedInterfaceLayoutConfig = normalizeInterfaceLayoutConfig(
    window.firechat.config.interfaceLayout
  );
  return cachedInterfaceLayoutConfig;
};
