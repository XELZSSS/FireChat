const { getPreferredConfigPath, readConfigFile, writeConfigFile } = require('./localConfig.cjs');
const {
  normalizeProviderAuthFile,
  normalizeProviderConfigFile,
  normalizeProviderConfigSnapshot,
} = require('./providerConfigSnapshot.cjs');

const FIRECHAT_AUTH_CONFIG_NAME = 'firechat.auth.json';

const readProviderConfigSnapshot = () => ({
  config: normalizeProviderConfigFile(readConfigFile()),
  auth: normalizeProviderAuthFile(readConfigFile(FIRECHAT_AUTH_CONFIG_NAME)),
});

const writeProviderConfigSnapshot = (snapshot) => {
  const nextSnapshot = normalizeProviderConfigSnapshot(snapshot);
  writeConfigFile(undefined, nextSnapshot.config);
  writeConfigFile(FIRECHAT_AUTH_CONFIG_NAME, nextSnapshot.auth);

  return nextSnapshot;
};

const getProviderConfigSnapshotPaths = () => ({
  configPath: getPreferredConfigPath(),
  authPath: getPreferredConfigPath(FIRECHAT_AUTH_CONFIG_NAME),
});

module.exports = {
  FIRECHAT_AUTH_CONFIG_NAME,
  getProviderConfigSnapshotPaths,
  normalizeProviderAuthFile,
  normalizeProviderConfigFile,
  readProviderConfigSnapshot,
  writeProviderConfigSnapshot,
};
