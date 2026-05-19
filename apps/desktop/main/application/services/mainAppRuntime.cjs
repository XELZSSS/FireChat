/* global console, process */
const { app, Menu } = require('electron');

const createMainAppRuntime = ({
  appUserModelId,
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
  stopMcpClients,
}) => {
  let isQuitting = false;
  const shouldPreventClose = () =>
    !isQuitting && process.platform === 'win32' && shouldCloseToTray();

  const stopRuntimeServices = () => {
    isQuitting = true;
    destroyTray();
    void stopLocalApiProxy();
    void stopMcpClients();
    closeFireChatDatabase();
  };

  const registerSingleInstanceLock = () => {
    const allowSecondInstance = isDev && process.env.FireChat_ALLOW_SECOND_INSTANCE === '1';
    if (allowSecondInstance) {
      return;
    }

    const gotLock = app.requestSingleInstanceLock();
    if (!gotLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      showWindow();
    });
  };

  const registerLifecycle = () => {
    app.on('before-quit', stopRuntimeServices);

    app.on('window-all-closed', () => {
      if (isQuitting || process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (getMainWindow()) {
        showWindow();
        return;
      }

      void createMainWindow({
        isDev,
        shouldPreventClose,
      }).catch((error) => {
        console.error('Failed to recreate main window on activate:', error);
      });
    });
  };

  const start = async () => {
    if (process.platform === 'win32') {
      app.setAppUserModelId(appUserModelId);
    }

    ensureInterfaceLayoutConfigFile();
    installOpenAdapterProtocolHandler();
    Menu.setApplicationMenu(null);
    registerAppIpcHandlers({
      registerWindowIpcHandlers,
      setTrayLanguage,
      setTrayLabels,
      checkForUpdates,
      openUpdateDownload,
      getUpdaterState,
      ...localDataResetHandlers,
    });

    await startBackgroundServices({
      createMainWindow,
      createTray,
      getMainWindow,
      checkForUpdates,
      initUpdater,
      isDev,
      onTrayQuit: () => {
        isQuitting = true;
      },
      shouldPreventClose,
      showWindow,
    });
  };

  return {
    registerLifecycle,
    registerSingleInstanceLock,
    start,
  };
};

module.exports = {
  createMainAppRuntime,
};
