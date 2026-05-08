const { invoke } = require('./ipc.cjs');

const createTrayBridge = ({ ipcRenderer, channels }) => ({
  setLanguage: invoke(ipcRenderer, channels.tray.setLanguage),
  setLabels: invoke(ipcRenderer, channels.tray.setLabels),
});

module.exports = {
  createTrayBridge,
};
