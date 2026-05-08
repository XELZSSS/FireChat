const { app } = require('electron');

const getDistributionMode = () => {
  return app.isPackaged ? 'installer' : 'development';
};

module.exports = {
  getDistributionMode,
};
