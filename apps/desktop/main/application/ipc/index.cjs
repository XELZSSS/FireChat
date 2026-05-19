const { ipcMain } = require('electron');
const { IPC_BOOTSTRAP_CHANNELS, IPC_CHANNELS } = require('./channels.cjs');
const { buildSystemHandlers } = require('./handlers/index.cjs');

const SYNC_BOOTSTRAP_CHANNELS = [
  IPC_BOOTSTRAP_CHANNELS.ipcChannels,
  IPC_BOOTSTRAP_CHANNELS.providerConfigSnapshot,
  IPC_BOOTSTRAP_CHANNELS.interfaceLayoutConfigSnapshot,
];

const getSyncStorageChannels = (ipcChannels) => [ipcChannels.storage.readAppStorage];

const registerSyncIpcHandlers = (handlers) => {
  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.on(channel, (event, ...args) => {
      event.returnValue = handler(event, ...args);
    });
  }
};

const registerIpcHandlers = (handlers) => {
  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, handler);
  }
};

const registerAppIpcHandlers = ({
  registerWindowIpcHandlers,
  setTrayLanguage,
  setTrayLabels,
  checkForUpdates,
  openUpdateDownload,
  getUpdaterState,
  prepareForResetLocalData,
  clearPersistedLocalData,
  recoverFromFailedLocalDataReset,
  finalizeLocalDataReset,
}) => {
  registerWindowIpcHandlers();

  const systemHandlers = buildSystemHandlers({
    setTrayLanguage,
    setTrayLabels,
    checkForUpdates,
    openUpdateDownload,
    getUpdaterState,
    prepareForResetLocalData,
    clearPersistedLocalData,
    recoverFromFailedLocalDataReset,
    finalizeLocalDataReset,
  });

  const syncChannels = [...SYNC_BOOTSTRAP_CHANNELS, ...getSyncStorageChannels(IPC_CHANNELS)];

  registerSyncIpcHandlers(
    Object.fromEntries(syncChannels.map((channel) => [channel, systemHandlers[channel]]))
  );

  registerIpcHandlers(
    Object.fromEntries(
      Object.entries(systemHandlers).filter(([channel]) => !syncChannels.includes(channel))
    )
  );
};

module.exports = {
  registerAppIpcHandlers,
};
