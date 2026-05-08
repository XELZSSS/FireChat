const { IPC_CHANNELS } = require('../channels.cjs');

const buildTrayHandlers = ({ setTrayLanguage, setTrayLabels }) => ({
  [IPC_CHANNELS.tray.setLanguage]: (_event, language) => {
    setTrayLanguage(language);
  },
  [IPC_CHANNELS.tray.setLabels]: (_event, labels) => {
    setTrayLabels(labels);
  },
});

module.exports = {
  buildTrayHandlers,
};
