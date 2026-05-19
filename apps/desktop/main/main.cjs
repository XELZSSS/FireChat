/* global console */
const { app } = require('electron');
const { loadLocalEnvFiles } = require('./infrastructure/config/env.cjs');
const { installConsoleStyle } = require('./shared/consoleStyle.cjs');
const {
  ensureInterfaceLayoutConfigFile,
} = require('./infrastructure/config/interfaceLayoutConfig.cjs');

loadLocalEnvFiles();

installConsoleStyle('main');

const { createLocalDataResetHandlers } = require('./application/bootstrap/resetLocalData.cjs');
const { createLocalDataResetPlan } = require('./application/bootstrap/localDataResetPlan.cjs');
const { startBackgroundServices } = require('./application/bootstrap/startup.cjs');
const { createMainAppRuntime } = require('./application/services/mainAppRuntime.cjs');

const {
  createMainWindow,
  getMainWindow,
  registerWindowIpcHandlers,
  showWindow,
} = require('./infrastructure/electron/appWindow.cjs');
const { shouldCloseToTray } = require('./infrastructure/electron/windowBehavior.cjs');
const {
  createTray,
  destroyTray,
  setTrayLanguage,
  setTrayLabels,
} = require('./infrastructure/electron/tray.cjs');
const { registerAppIpcHandlers } = require('./application/ipc/index.cjs');
const {
  initUpdater,
  checkForUpdates,
  openUpdateDownload,
  getUpdaterState,
} = require('./infrastructure/network/updater/index.cjs');
const { stopLocalApiProxy } = require('./infrastructure/network/localApiProxy.cjs');
const {
  closeFireChatDatabase,
} = require('../../../packages/data/persistence/runtime/sqliteStore.cjs');
const {
  installOpenAdapterProtocolHandler,
  registerOpenAdapterScheme,
} = require('./infrastructure/network/openadapterProtocol.cjs');

const isDev = !app.isPackaged;
const APP_USER_MODEL_ID = 'com.firechat.app';

registerOpenAdapterScheme();

const localDataResetHandlers = createLocalDataResetHandlers({
  ...createLocalDataResetPlan({ isDev }),
  deferResetUntilNextLaunch: app.isPackaged,
});

try {
  localDataResetHandlers.applyPendingLocalDataReset();
} catch (error) {
  console.error('Failed to apply pending local data reset:', error);
}

const mainAppRuntime = createMainAppRuntime({
  appUserModelId: APP_USER_MODEL_ID,
  checkForUpdates,
  closeFireChatDatabase,
  createMainWindow,
  createTray,
  destroyTray,
  ensureInterfaceLayoutConfigFile,
  getMainWindow,
  getUpdaterState,
  initUpdater,
  installOpenAdapterProtocolHandler,
  isDev,
  localDataResetHandlers,
  openUpdateDownload,
  registerAppIpcHandlers,
  registerWindowIpcHandlers,
  setTrayLabels,
  setTrayLanguage,
  shouldCloseToTray,
  showWindow,
  startBackgroundServices,
  stopLocalApiProxy,
});

mainAppRuntime.registerSingleInstanceLock();
mainAppRuntime.registerLifecycle();

void app.whenReady().then(() => mainAppRuntime.start());
