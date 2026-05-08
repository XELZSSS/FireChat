const startBackgroundServices = async ({
  createMainWindow,
  createTray,
  getMainWindow,
  checkForUpdates,
  initUpdater,
  isDev,
  onTrayQuit,
  shouldPreventClose,
  showWindow,
}) => {
  try {
    await createMainWindow({
      isDev,
      shouldPreventClose,
    });
  } catch (error) {
    console.error('Failed to create main window:', error);
    return;
  }

  try {
    createTray({
      isDev,
      getMainWindow,
      showWindow,
      onQuit: onTrayQuit,
    });
  } catch (error) {
    console.error('Failed to create tray:', error);
  }

  try {
    initUpdater();
    void checkForUpdates();
  } catch (error) {
    console.error('Failed to initialize updater:', error);
  }
};

module.exports = {
  startBackgroundServices,
};
