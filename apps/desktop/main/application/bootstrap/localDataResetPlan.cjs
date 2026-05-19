const path = require('path');
const { app } = require('electron');
const {
  getProviderConfigSnapshotPaths,
} = require('../../infrastructure/config/providerConfig.cjs');
const {
  getInterfaceLayoutConfigPath,
} = require('../../infrastructure/config/interfaceLayoutConfig.cjs');
const { WINDOW_BEHAVIOR_FILE } = require('../../infrastructure/electron/windowBehavior.cjs');
const {
  getFireChatDatabasePaths,
} = require('../../../../../packages/data/persistence/runtime/sqliteStore.cjs');

const buildDevResetTargetPaths = (userDataPath) => [
  path.join(userDataPath, 'theme-state.json'),
  path.join(userDataPath, 'startup-appearance.json'),
  path.join(userDataPath, 'window-state.json'),
  WINDOW_BEHAVIOR_FILE,
  path.join(userDataPath, 'auth'),
  path.join(userDataPath, 'request-logs.json'),
  ...getFireChatDatabasePaths(),
  path.join(userDataPath, '.updaterId'),
  path.join(userDataPath, 'firechat-meta.json'),
];

const createLocalDataResetPlan = ({ isDev }) => {
  const userDataPath = app.getPath('userData');
  const { configPath: providerConfigPath, authPath: providerAuthPath } =
    getProviderConfigSnapshotPaths();
  const interfaceLayoutConfigPath = getInterfaceLayoutConfigPath();

  return {
    userDataPath,
    preservedPaths: [providerConfigPath, providerAuthPath, interfaceLayoutConfigPath],
    resetTargetPaths: isDev ? buildDevResetTargetPaths(userDataPath) : [],
    resetMarkerPath: path.join(userDataPath, 'firechat-reset-pending.json'),
  };
};

module.exports = {
  createLocalDataResetPlan,
};
