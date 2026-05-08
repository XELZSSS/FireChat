const { IPC_BOOTSTRAP_CHANNELS, IPC_CHANNELS } = require('../channels.cjs');
const {
  readInterfaceLayoutConfig,
} = require('../../../infrastructure/config/interfaceLayoutConfig.cjs');
const {
  readProviderConfigSnapshot,
} = require('../../../infrastructure/config/providerConfig.cjs');

const buildBootstrapHandlers = () => ({
  [IPC_BOOTSTRAP_CHANNELS.ipcChannels]: () => IPC_CHANNELS,
  [IPC_BOOTSTRAP_CHANNELS.providerConfigSnapshot]: () => readProviderConfigSnapshot(),
  [IPC_BOOTSTRAP_CHANNELS.interfaceLayoutConfigSnapshot]: () => readInterfaceLayoutConfig(),
});

module.exports = {
  buildBootstrapHandlers,
};
