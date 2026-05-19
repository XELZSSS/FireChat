const {
  createStorageRepository,
} = require('../../../../../../packages/data/persistence/repositories/storageRepository.cjs');
const { buildAppHandlers } = require('./appHandlers.cjs');
const { buildBootstrapHandlers } = require('./bootstrapHandlers.cjs');
const { buildStorageHandlers } = require('./storageHandlers.cjs');
const { buildTrayHandlers } = require('./trayHandlers.cjs');
const { buildUpdaterHandlers } = require('./updaterHandlers.cjs');

const storageRepository = createStorageRepository();

const buildSystemHandlers = (dependencies) => ({
  ...buildBootstrapHandlers(),
  ...buildTrayHandlers(dependencies),
  ...buildUpdaterHandlers(dependencies),
  ...buildAppHandlers({ ...dependencies, storageRepository }),
  ...buildStorageHandlers({ storageRepository }),
});

module.exports = {
  buildSystemHandlers,
};

