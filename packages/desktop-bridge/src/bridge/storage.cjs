const { invoke, invokeSync } = require('./ipc.cjs');

const createStorageBridge = ({ ipcRenderer, channels }) => ({
  readAppStorage: invokeSync(ipcRenderer, channels.storage.readAppStorage),
  writeAppStorage: invoke(ipcRenderer, channels.storage.writeAppStorage),
  removeAppStorage: invoke(ipcRenderer, channels.storage.removeAppStorage),
  getSessionSummaries: invoke(ipcRenderer, channels.storage.getSessionSummaries),
  getSession: invoke(ipcRenderer, channels.storage.getSession),
  saveSession: invoke(ipcRenderer, channels.storage.saveSession),
  updateSessionTitle: invoke(ipcRenderer, channels.storage.updateSessionTitle),
  deleteSession: invoke(ipcRenderer, channels.storage.deleteSession),
  searchSessionSummaries: invoke(ipcRenderer, channels.storage.searchSessionSummaries),
  getActiveSessionId: invoke(ipcRenderer, channels.storage.getActiveSessionId),
  setActiveSessionId: invoke(ipcRenderer, channels.storage.setActiveSessionId),
  clearActiveSessionId: invoke(ipcRenderer, channels.storage.clearActiveSessionId),
});

module.exports = {
  createStorageBridge,
};
