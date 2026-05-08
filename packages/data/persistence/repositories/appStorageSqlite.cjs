const { getDatabase } = require('../schema/sqliteDatabase.cjs');
const { normalizeRequiredString } = require('../schema/sqliteNormalization.cjs');

const readAppStorage = (key) => {
  const storageKey = normalizeRequiredString(key, 'storage key');
  const row = getDatabase().prepare('SELECT value FROM app_storage WHERE key = ?').get(storageKey);
  return typeof row?.value === 'string' ? row.value : null;
};

const writeAppStorage = ({ key, value }) => {
  const storageKey = normalizeRequiredString(key, 'storage key');
  if (typeof value !== 'string') {
    throw new Error('storage value must be a string.');
  }

  getDatabase()
    .prepare(
      `
        INSERT INTO app_storage (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `
    )
    .run(storageKey, value, Date.now());
};

const removeAppStorage = (key) => {
  const storageKey = normalizeRequiredString(key, 'storage key');
  getDatabase().prepare('DELETE FROM app_storage WHERE key = ?').run(storageKey);
};

module.exports = {
  readAppStorage,
  removeAppStorage,
  writeAppStorage,
};
