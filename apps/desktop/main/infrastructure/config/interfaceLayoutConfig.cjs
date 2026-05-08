const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { readJsonObjectFile, writeJsonFile } = require('../../shared/utils/jsonObjectFile.cjs');

const FIRECHAT_INTERFACE_CONFIG_NAME = 'firechat.interface.json';
const INTERFACE_LAYOUT_FIELDS = new Set([
  'language',
  'theme',
  'accent',
  'uiFontPreset',
  'uiFontSize',
  'uiFontCustom',
  'reduceMotion',
  'sidebarCollapsed',
]);
const INTERFACE_LAYOUT_FIELD_LIST = Array.from(INTERFACE_LAYOUT_FIELDS);

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

const DEFAULT_INTERFACE_LAYOUT_CONFIG = {
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

const getInterfaceLayoutConfigPath = () => {
  return path.join(app.getPath('userData'), FIRECHAT_INTERFACE_CONFIG_NAME);
};

const normalizeCssLines = (value, defaultLines) => {
  if (Array.isArray(value)) {
    const lines = value.filter((item) => typeof item === 'string');
    return lines.length > 0 ? lines : defaultLines;
  }

  if (typeof value === 'string') {
    const lines = value.split(/\r?\n/).map((line) => line.replace(/\r/g, ''));
    return lines.some((line) => line.trim().length > 0) ? lines : defaultLines;
  }

  return defaultLines;
};

const normalizeInterfaceLayoutRows = (value) => {
  const rows = Array.isArray(value) ? value : [];
  const seenFields = new Set();

  return rows
    .map((row) => {
      if (!Array.isArray(row)) {
        return [];
      }

      return row.filter((item) => {
        if (
          typeof item !== 'string' ||
          !INTERFACE_LAYOUT_FIELDS.has(item) ||
          seenFields.has(item)
        ) {
          return false;
        }

        seenFields.add(item);
        return true;
      });
    })
    .filter((row) => row.length > 0);
};

const normalizeInterfaceLayoutConfig = (value) => {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const normalizedRows = normalizeInterfaceLayoutRows(record.interfaceCard);

  return {
    schemaVersion: 1,
    availableFields: INTERFACE_LAYOUT_FIELD_LIST,
    interfaceCard:
      normalizedRows.length > 0
        ? normalizedRows
        : DEFAULT_INTERFACE_LAYOUT_CONFIG.interfaceCard.map((row) => [...row]),
    fontCss: normalizeCssLines(record.fontCss, DEFAULT_FONT_CSS),
    colorCss: normalizeCssLines(record.colorCss, DEFAULT_COLOR_CSS),
  };
};

const ensureInterfaceLayoutConfigFile = () => {
  const configPath = getInterfaceLayoutConfigPath();
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    writeJsonFile(configPath, DEFAULT_INTERFACE_LAYOUT_CONFIG, { trailingNewline: true });
  }

  return configPath;
};

const readInterfaceLayoutConfig = () => {
  const configPath = ensureInterfaceLayoutConfigFile();
  try {
    return normalizeInterfaceLayoutConfig(
      readJsonObjectFile(configPath, DEFAULT_INTERFACE_LAYOUT_CONFIG)
    );
  } catch {
    writeJsonFile(configPath, DEFAULT_INTERFACE_LAYOUT_CONFIG, { trailingNewline: true });
    return { ...DEFAULT_INTERFACE_LAYOUT_CONFIG };
  }
};

const writeInterfaceLayoutConfig = (value) => {
  const configPath = ensureInterfaceLayoutConfigFile();
  const nextValue = normalizeInterfaceLayoutConfig(value);
  writeJsonFile(configPath, nextValue, { trailingNewline: true });
  return nextValue;
};

module.exports = {
  FIRECHAT_INTERFACE_CONFIG_NAME,
  DEFAULT_INTERFACE_LAYOUT_CONFIG,
  ensureInterfaceLayoutConfigFile,
  getInterfaceLayoutConfigPath,
  normalizeInterfaceLayoutConfig,
  readInterfaceLayoutConfig,
  writeInterfaceLayoutConfig,
};
