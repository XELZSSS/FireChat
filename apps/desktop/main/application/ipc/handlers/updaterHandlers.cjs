const { IPC_CHANNELS } = require('../channels.cjs');

const buildUpdaterHandlers = ({ checkForUpdates, openUpdateDownload, getUpdaterState }) => ({
  [IPC_CHANNELS.updater.check]: async () => {
    await checkForUpdates();
  },
  [IPC_CHANNELS.updater.openDownload]: async () => openUpdateDownload(),
  [IPC_CHANNELS.updater.getStatus]: () => getUpdaterState(),
});

module.exports = {
  buildUpdaterHandlers,
};
