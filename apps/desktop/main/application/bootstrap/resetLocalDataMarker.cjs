const fs = require('fs');
const path = require('path');

const RESET_MARKER_VERSION = 1;

const writePendingResetMarker = (markerPath, targetPaths) => {
  fs.mkdirSync(path.dirname(markerPath), { recursive: true });
  fs.writeFileSync(
    markerPath,
    JSON.stringify(
      {
        version: RESET_MARKER_VERSION,
        targetPaths,
      },
      null,
      2
    ),
    'utf8'
  );
};

const readPendingResetMarker = (markerPath) => {
  try {
    const raw = fs.readFileSync(markerPath, 'utf8');
    const parsed = JSON.parse(raw);
    const targetPaths = Array.isArray(parsed?.targetPaths)
      ? parsed.targetPaths.filter((targetPath) => typeof targetPath === 'string')
      : [];

    return {
      version: parsed?.version ?? 0,
      targetPaths,
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
};

const removePendingResetMarker = (markerPath) => {
  try {
    fs.rmSync(markerPath, {
      force: true,
      maxRetries: 5,
      retryDelay: 150,
    });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return;
    }

    throw error;
  }
};

module.exports = {
  RESET_MARKER_VERSION,
  readPendingResetMarker,
  removePendingResetMarker,
  writePendingResetMarker,
};
