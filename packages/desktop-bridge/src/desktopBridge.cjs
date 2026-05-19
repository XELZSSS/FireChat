const { createAppBridge } = require('./bridge/app.cjs');
const { createStorageBridge } = require('./bridge/storage.cjs');
const { createTrayBridge } = require('./bridge/tray.cjs');
const { createUpdaterBridge } = require('./bridge/updater.cjs');
const { createWindowBridge } = require('./bridge/window.cjs');

const buildDesktopBridge = ({
  ipcRenderer,
  channels,
  runtimeEnv,
  providerFileSnapshot,
  interfaceLayoutConfig,
  subscribeMaximizeChanged,
}) => ({
  config: {
    env: runtimeEnv,
    providerFiles: providerFileSnapshot ?? { config: { providers: {} }, auth: { providers: {} } },
    interfaceLayout: interfaceLayoutConfig ?? { interfaceCard: [], fontCss: [], colorCss: [] },
  },
  window: createWindowBridge({ ipcRenderer, channels, subscribeMaximizeChanged }),
  updater: createUpdaterBridge({ ipcRenderer, channels }),
  app: createAppBridge({ ipcRenderer, channels }),
  storage: createStorageBridge({ ipcRenderer, channels }),
  tray: createTrayBridge({ ipcRenderer, channels }),
});

module.exports = {
  buildDesktopBridge,
};
