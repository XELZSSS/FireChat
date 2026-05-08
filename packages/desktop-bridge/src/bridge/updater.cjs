const { invoke, subscribe } = require('./ipc.cjs');

const createUpdaterBridge = ({ ipcRenderer, channels }) => ({
  check: invoke(ipcRenderer, channels.updater.check),
  openDownload: invoke(ipcRenderer, channels.updater.openDownload),
  getStatus: invoke(ipcRenderer, channels.updater.getStatus),
  onStatus: subscribe(ipcRenderer, channels.updater.status),
});

module.exports = {
  createUpdaterBridge,
};
