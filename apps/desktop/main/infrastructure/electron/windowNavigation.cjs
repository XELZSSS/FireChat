const { app, shell } = require('electron');
const path = require('path');
const { fileURLToPath } = require('url');
const { parseExternalHttpUrl, shouldOpenExternalUrl } = require('../../../../shared/external-url.cjs');

const DEV_SERVER_URL = 'http://localhost:3000';

const isDevServerNavigation = (url, devServerUrl) => {
  const parsed = parseExternalHttpUrl(url);
  if (!parsed) return false;

  try {
    return parsed.origin === new URL(devServerUrl ?? DEV_SERVER_URL).origin;
  } catch {
    return false;
  }
};

const isPackagedAppNavigation = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'file:') {
      return false;
    }

    return (
      path.normalize(fileURLToPath(parsed)) ===
      path.normalize(path.join(app.getAppPath(), 'dist', 'index.html'))
    );
  } catch {
    return false;
  }
};

const isAllowedAppNavigation = (url, isDev, devServerUrl) =>
  isDev ? isDevServerNavigation(url, devServerUrl) : isPackagedAppNavigation(url);

const registerExternalNavigationGuards = (win, isDev, toggleWindowDevTools) => {
  win.webContents.setWindowOpenHandler(({ url }) => {
    const parsed = parseExternalHttpUrl(url);
    if (parsed && shouldOpenExternalUrl(url, isDev, process.env.VITE_DEV_SERVER_URL)) {
      void shell.openExternal(parsed.toString());
      return { action: 'deny' };
    }

    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (isAllowedAppNavigation(url, isDev, process.env.VITE_DEV_SERVER_URL)) {
      return;
    }

    event.preventDefault();
    const parsed = parseExternalHttpUrl(url);
    if (parsed && shouldOpenExternalUrl(url, isDev, process.env.VITE_DEV_SERVER_URL)) {
      void shell.openExternal(parsed.toString());
    }
  });

  win.webContents.on('before-input-event', (event, input) => {
    const isToggleDevToolsShortcut =
      input.type === 'keyDown' &&
      input.shift &&
      ((process.platform === 'darwin' && input.meta) ||
        (process.platform !== 'darwin' && input.control)) &&
      input.key.toLowerCase() === 'i';

    if (!isToggleDevToolsShortcut) {
      return;
    }

    event.preventDefault();
    toggleWindowDevTools(win);
  });
};

module.exports = {
  registerExternalNavigationGuards,
};
