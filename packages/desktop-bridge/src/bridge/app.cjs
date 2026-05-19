const { invoke } = require('./ipc.cjs');

const createAppBridge = ({ ipcRenderer, channels }) => ({
  openExternal: invoke(ipcRenderer, channels.app.openExternal),
  openLocalConfig: invoke(ipcRenderer, channels.app.openLocalConfig),
  openConfigDirectory: invoke(ipcRenderer, channels.app.openConfigDirectory),
  exportOptionsConfig: invoke(ipcRenderer, channels.app.exportOptionsConfig),
  importOptionsConfig: invoke(ipcRenderer, channels.app.importOptionsConfig),
  getInterfaceLayoutConfig: invoke(ipcRenderer, channels.app.getInterfaceLayoutConfig),
  saveInterfaceLayoutConfig: invoke(ipcRenderer, channels.app.saveInterfaceLayoutConfig),
  getProviderConfigSnapshot: invoke(ipcRenderer, channels.app.getProviderConfigSnapshot),
  saveProviderConfigSnapshot: invoke(ipcRenderer, channels.app.saveProviderConfigSnapshot),
  parseAttachment: invoke(ipcRenderer, channels.app.parseAttachment),
  getLocalProxyBaseUrl: invoke(ipcRenderer, channels.app.getLocalProxyBaseUrl),
  getLocalProxyConfig: invoke(ipcRenderer, channels.app.getLocalProxyConfig),
  syncLocalProxyConfig: invoke(ipcRenderer, channels.app.syncLocalProxyConfig),
  updateLocalProxyConfig: invoke(ipcRenderer, channels.app.updateLocalProxyConfig),
  updateWindowBehavior: invoke(ipcRenderer, channels.app.updateWindowBehavior),
  appendRequestLog: invoke(ipcRenderer, channels.app.appendRequestLog),
  queryRequestLogs: invoke(ipcRenderer, channels.app.queryRequestLogs),
  clearRequestLogs: invoke(ipcRenderer, channels.app.clearRequestLogs),
  updateStartupAppearance: invoke(ipcRenderer, channels.app.updateStartupAppearance),
  resetLocalData: invoke(ipcRenderer, channels.app.resetLocalData),
});

module.exports = {
  createAppBridge,
};
