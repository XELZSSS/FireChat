/* global process */

const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeText = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const resolveTemplateString = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  return normalized.replace(/\{env:([^}]+)\}/g, (_match, name) => {
    const envKey = String(name ?? '').trim();
    return envKey ? (process.env[envKey] ?? '') : '';
  });
};

module.exports = {
  isPlainObject,
  normalizeText,
  resolveTemplateString,
};
