const { app } = require('electron');
const path = require('path');

const DEV_SERVER_LOAD_RETRY_DELAY_MS = 500;
const DEV_SERVER_LOAD_MAX_ATTEMPTS = 30;

const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadDevServerContent = async (win, devUrl, isLiveWindow) => {
  let lastError = null;

  for (let attempt = 1; attempt <= DEV_SERVER_LOAD_MAX_ATTEMPTS; attempt += 1) {
    try {
      await win.loadURL(devUrl);
      return;
    } catch (error) {
      lastError = error;
      if (!isLiveWindow(win)) {
        return;
      }

      if (attempt === DEV_SERVER_LOAD_MAX_ATTEMPTS) {
        break;
      }

      await waitFor(DEV_SERVER_LOAD_RETRY_DELAY_MS);
    }
  }

  throw lastError ?? new Error(`Failed to load development URL: ${devUrl}`);
};

const loadWindowContent = async (win, isDev, isLiveWindow) => {
  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:3000';
    await loadDevServerContent(win, devUrl, isLiveWindow);
    return;
  }

  await win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
};

module.exports = {
  loadWindowContent,
};
