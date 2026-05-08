/* global setTimeout, console */
const { app, dialog } = require('electron');
const fs = require('fs');

const clearBrowserData = async () => {
  const { session } = require('electron');
  if (typeof session.defaultSession.clearAuthCache === 'function') {
    await session.defaultSession.clearAuthCache();
  }
  await session.defaultSession.clearCache();
  await session.defaultSession.clearStorageData({
    storages: [
      'cookies',
      'filesystem',
      'indexdb',
      'localstorage',
      'shadercache',
      'websql',
      'serviceworkers',
      'cachestorage',
    ],
  });
  return { ok: true };
};

const toRecord = (payload) => (payload && typeof payload === 'object' ? payload : {});

const scheduleAppLifecycleAction = (action) => {
  setTimeout(() => {
    if (action === 'relaunch') {
      app.relaunch();
    }

    void app.quit();
  }, 600);
};

const runLocalDataReset = async ({
  prepareForResetLocalData,
  clearPersistedLocalData,
  recoverFromFailedLocalDataReset,
  finalizeLocalDataReset,
}) => {
  const action = app.isPackaged ? 'relaunch' : 'exit';
  try {
    if (typeof prepareForResetLocalData === 'function') {
      await prepareForResetLocalData();
    }

    const result = await clearBrowserData();

    if (typeof clearPersistedLocalData === 'function') {
      await clearPersistedLocalData();
    }

    scheduleAppLifecycleAction(action);
    return {
      ...result,
      action,
      relaunching: action === 'relaunch',
    };
  } catch (error) {
    if (typeof recoverFromFailedLocalDataReset === 'function') {
      try {
        await recoverFromFailedLocalDataReset();
      } catch (recoveryError) {
        console.error('Failed to recover after local data reset error:', recoveryError);
      }
    }

    throw error;
  } finally {
    if (typeof finalizeLocalDataReset === 'function') {
      await finalizeLocalDataReset();
    }
  }
};

const exportOptionsConfig = async (payload) => {
  const result = await dialog.showSaveDialog({
    title: 'Export options',
    defaultPath: `firechat-options-${app.getVersion()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  fs.writeFileSync(result.filePath, `${JSON.stringify(toRecord(payload), null, 2)}\n`, 'utf8');
  return { canceled: false, filePath: result.filePath };
};

const importOptionsConfig = async () => {
  const result = await dialog.showOpenDialog({
    title: 'Import options',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  const filePath = result.filePaths[0];
  if (result.canceled || !filePath) {
    return { canceled: true };
  }

  return {
    canceled: false,
    filePath,
    value: JSON.parse(fs.readFileSync(filePath, 'utf8')),
  };
};

module.exports = {
  exportOptionsConfig,
  importOptionsConfig,
  runLocalDataReset,
  toRecord,
};
