module.exports = {
  persistence: require('./persistence/repositories/storageRepository.cjs'),
  sqlite: require('./persistence/runtime/sqliteStore.cjs'),
};
