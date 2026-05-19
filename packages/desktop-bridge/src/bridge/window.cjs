const { invoke, subscribe } = require('./ipc.cjs');

const createWindowBridge = ({ ipcRenderer, channels, subscribeMaximizeChanged }) => ({
  minimize: invoke(ipcRenderer, channels.window.minimize),
  toggleMaximize: invoke(ipcRenderer, channels.window.toggleMaximize),
  close: invoke(ipcRenderer, channels.window.close),
  isMaximized: invoke(ipcRenderer, channels.window.isMaximized),
  getAppVersion: invoke(ipcRenderer, channels.window.getAppVersion),
  getSystemLanguage: invoke(ipcRenderer, channels.window.getSystemLanguage),
  getSystemTheme: invoke(ipcRenderer, channels.window.getSystemTheme),
  onMaximizeChanged: subscribeMaximizeChanged,
  onSystemThemeChanged: subscribe(ipcRenderer, channels.window.systemThemeChanged, (theme) => theme),
  onSystemLanguageChanged: subscribe(
    ipcRenderer,
    channels.window.systemLanguageChanged,
    (lang) => lang
  ),
});

module.exports = {
  createWindowBridge,
};
