const { isPlainObject } = require('../../shared/utils/normalize.cjs');

const normalizeProviderRecord = (value) => {
  if (!isPlainObject(value)) {
    return {};
  }

  const next = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = typeof key === 'string' ? key.trim() : '';
    if (!normalizedKey || !isPlainObject(entry)) {
      continue;
    }

    next[normalizedKey] = entry;
  }

  return next;
};

const normalizeProviderConfigFile = (value) => {
  const next = isPlainObject(value) ? { ...value } : {};
  next.providers = normalizeProviderRecord(next.providers);
  return next;
};

const normalizeProviderAuthFile = normalizeProviderConfigFile;

const normalizeProviderConfigSnapshot = (snapshot) => ({
  config: normalizeProviderConfigFile(snapshot?.config),
  auth: normalizeProviderAuthFile(snapshot?.auth),
});

module.exports = {
  normalizeProviderAuthFile,
  normalizeProviderConfigFile,
  normalizeProviderConfigSnapshot,
};
