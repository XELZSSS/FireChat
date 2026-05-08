/* global setTimeout */
const {
  RESET_MARKER_VERSION,
  readPendingResetMarker,
  removePendingResetMarker,
  writePendingResetMarker,
} = require('./resetLocalDataMarker.cjs');
const {
  createResetTargetSnapshot,
  restoreResetTargetSnapshot,
} = require('./resetLocalDataSnapshot.cjs');
const { removeResetTarget, resolveResetTargets } = require('./resetLocalDataTargets.cjs');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createLocalDataResetHandlers = ({
  userDataPath,
  preservedPaths = [],
  preservedEntryNames = [],
  resetTargetPaths = [],
  deferResetUntilNextLaunch = false,
  resetMarkerPath = '',
}) => {
  let pendingSnapshots = [];
  let pendingResetTargets = [];

  const getResetTargets = () =>
    pendingResetTargets.length > 0
      ? pendingResetTargets
      : resolveResetTargets({
          userDataPath,
          preservedPaths,
          preservedEntryNames,
          resetTargetPaths,
        });

  return {
    prepareForResetLocalData: async () => {
      await wait(200);
      pendingResetTargets = resolveResetTargets({
        userDataPath,
        preservedPaths,
        preservedEntryNames,
        resetTargetPaths,
      });
      pendingSnapshots = deferResetUntilNextLaunch
        ? []
        : pendingResetTargets
            .map((targetPath) => createResetTargetSnapshot(targetPath))
            .filter(Boolean);
    },
    clearPersistedLocalData: async () => {
      const resetTargets = getResetTargets();

      if (deferResetUntilNextLaunch) {
        writePendingResetMarker(resetMarkerPath, resetTargets);
        return;
      }

      for (const targetPath of resetTargets) {
        removeResetTarget(targetPath);
      }
    },
    recoverFromFailedLocalDataReset: async () => {
      if (deferResetUntilNextLaunch) {
        removePendingResetMarker(resetMarkerPath);
        return;
      }

      for (const snapshot of pendingSnapshots) {
        restoreResetTargetSnapshot(snapshot);
      }
    },
    finalizeLocalDataReset: async () => {
      pendingSnapshots = [];
      pendingResetTargets = [];
    },
    applyPendingLocalDataReset: () => {
      if (!deferResetUntilNextLaunch) {
        return;
      }

      const marker = readPendingResetMarker(resetMarkerPath);
      if (!marker || marker.version !== RESET_MARKER_VERSION || marker.targetPaths.length === 0) {
        removePendingResetMarker(resetMarkerPath);
        return;
      }

      const failedTargetPaths = [];
      for (const targetPath of marker.targetPaths) {
        try {
          removeResetTarget(targetPath);
        } catch {
          failedTargetPaths.push(targetPath);
        }
      }

      if (failedTargetPaths.length === 0) {
        removePendingResetMarker(resetMarkerPath);
        return;
      }

      writePendingResetMarker(resetMarkerPath, failedTargetPaths);
      throw new Error(
        `Failed to remove ${failedTargetPaths.length} pending local data reset target(s).`
      );
    },
  };
};

module.exports = {
  createLocalDataResetHandlers,
};
