/* global process */
const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const { IPC_CHANNELS } = require('../../application/ipc/channels.cjs');
const {
  BACKGROUND_BY_THEME,
  normalizeStartupAppearance,
  readStartupAppearance,
} = require('./startupAppearance.cjs');
const {
  MIN_WINDOW_SIZE,
  createWindowStateController,
  loadDefaultWindowState,
} = require('./windowState.cjs');
const { loadWindowContent } = require('./windowContent.cjs');
const { registerExternalNavigationGuards } = require('./windowNavigation.cjs');
const { createSystemLanguageMonitor } = require('./systemLanguageMonitor.cjs');
const {
  shouldMinimizeToTray,
  shouldRememberWindowBounds,
  shouldStartMinimizedToTray,
} = require('./windowBehavior.cjs');
let mainWindow = null;
let currentAppearance = readStartupAppearance(nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
let mainWindowShouldPreventClose = () => false;

const isLiveWindow = (win) => Boolean(win && !win.isDestroyed());
const getAppWindows = () => BrowserWindow.getAllWindows().filter(isLiveWindow);
const getEventWindow = (event) => BrowserWindow.fromWebContents(event.sender);
const getSystemTheme = () => (nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
const getSystemLanguage = () => app.getPreferredSystemLanguages?.()?.[0] ?? app.getLocale();
const getWindowBackgroundColor = () => BACKGROUND_BY_THEME[currentAppearance.theme];

const getWindowIcon = () => {
  const root = app.getAppPath();
  const iconName = nativeTheme.shouldUseDarkColors ? 'app' : 'app-dark';
  const extension = process.platform === 'win32' ? 'ico' : 'png';
  return path.join(root, 'assets', 'icons', `${iconName}.${extension}`);
};

const createWindowWebPreferences = () => ({
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false,
  preload: path.join(
    app.getAppPath(),
    'apps',
    'desktop',
    'main',
    'infrastructure',
    'electron',
    'preload.cjs'
  ),
});

const createWindowOptions = (overrides = {}) => ({
  minWidth: MIN_WINDOW_SIZE.width,
  minHeight: MIN_WINDOW_SIZE.height,
  show: false,
  backgroundColor: getWindowBackgroundColor(),
  transparent: false,
  autoHideMenuBar: true,
  frame: false,
  icon: getWindowIcon(),
  webPreferences: createWindowWebPreferences(),
  ...overrides,
});

const setWindowBackground = (win) => {
  if (!isLiveWindow(win)) return;
  win.setBackgroundColor(getWindowBackgroundColor());
};

const setWindowIcon = (win) => {
  if (!isLiveWindow(win)) return;
  win.setIcon(getWindowIcon());
};

const applyWindowChrome = (win) => {
  setWindowBackground(win);
  setWindowIcon(win);
};

const applyWindowAppearance = (appearance) => {
  currentAppearance = normalizeStartupAppearance(appearance, getSystemTheme());
  nativeTheme.themeSource = currentAppearance.themePreference;
  getAppWindows().forEach(applyWindowChrome);
};

const emitWindowStateEvent = (channel, win) => {
  if (!isLiveWindow(win)) return;
  win.webContents.send(channel);
};

const emitWindowStateEventToAll = (channel) => {
  getAppWindows().forEach((win) => emitWindowStateEvent(channel, win));
};
const { clearWindowStateSaveTimer, loadWindowState, saveWindowState, scheduleWindowStateSave } =
  createWindowStateController({ isLiveWindow });

const showWindow = (win = mainWindow) => {
  if (!isLiveWindow(win)) return;
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
  win.focus();
};

const getMainWindow = () => mainWindow;

const toggleWindowDevTools = (win) => {
  if (!isLiveWindow(win)) return;
  if (win.webContents.isDevToolsOpened()) {
    win.webContents.closeDevTools();
    return;
  }

  win.webContents.openDevTools({ mode: 'detach' });
};

const emitSystemThemeChanged = () => {
  if (currentAppearance.themePreference === 'system') {
    currentAppearance = normalizeStartupAppearance(currentAppearance, getSystemTheme());
  }
  getAppWindows().forEach(applyWindowChrome);
  emitWindowStateEventToAll(IPC_CHANNELS.window.systemThemeChanged);
};
const systemLanguageMonitor = createSystemLanguageMonitor({
  getAppWindows,
  getSystemLanguage,
  onLanguageChanged: () => emitWindowStateEventToAll(IPC_CHANNELS.window.systemLanguageChanged),
});

const withEventWindow =
  (handler, defaultReturn) =>
  (event, ...args) => {
    const targetWindow = getEventWindow(event);
    if (!isLiveWindow(targetWindow)) return defaultReturn;
    return handler(targetWindow, ...args);
  };

const bindWindowStateEvents = (win, persistState) => {
  if (!isLiveWindow(win)) return;

  systemLanguageMonitor.sync();

  win.on('resize', () => {
    if (persistState) {
      scheduleWindowStateSave(win);
    }
    setWindowBackground(win);
  });

  if (persistState) {
    win.on('move', () => scheduleWindowStateSave(win));
  }

  win.on('minimize', (event) => {
    if (!shouldMinimizeToTray()) {
      return;
    }

    event.preventDefault();
    win.hide();
  });

  win.on('maximize', () => {
    if (persistState) {
      scheduleWindowStateSave(win);
    }
    emitWindowStateEvent(IPC_CHANNELS.window.maximize, win);
  });
  win.on('unmaximize', () => {
    if (persistState) {
      scheduleWindowStateSave(win);
    }
    emitWindowStateEvent(IPC_CHANNELS.window.unmaximize, win);
  });
};

const createMainWindow = async ({ isDev, shouldPreventClose }) => {
  const persistWindowState = shouldRememberWindowBounds();
  const state = persistWindowState ? loadWindowState() : loadDefaultWindowState();
  applyWindowAppearance(readStartupAppearance(getSystemTheme()));
  mainWindowShouldPreventClose = shouldPreventClose ?? (() => false);

  mainWindow = new BrowserWindow(
    createWindowOptions({
      width: state.width,
      height: state.height,
      x: state.x,
      y: state.y,
    })
  );

  mainWindow.setIcon(getWindowIcon());
  mainWindow.setBackgroundColor(getWindowBackgroundColor());
  mainWindow.setAutoHideMenuBar(true);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();
  registerExternalNavigationGuards(mainWindow, isDev, toggleWindowDevTools);

  if (state.isMaximized) {
    mainWindow.maximize();
  }
  let windowReadyToShow = false;
  let rendererReady = false;
  const startHidden = shouldStartMinimizedToTray();
  const tryShowMainWindow = () => {
    if (!windowReadyToShow || !rendererReady) {
      return;
    }

    if (startHidden) {
      return;
    }

    showWindow(mainWindow);
  };

  mainWindow.once('ready-to-show', () => {
    windowReadyToShow = true;
    tryShowMainWindow();
  });

  mainWindow.on('close', (event) => {
    if (mainWindowShouldPreventClose()) {
      event.preventDefault();
      mainWindow.hide();
      return;
    }
    if (persistWindowState) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on('closed', () => {
    clearWindowStateSaveTimer();
    mainWindow = null;
  });

  bindWindowStateEvents(mainWindow, persistWindowState);
  await loadWindowContent(mainWindow, isDev, isLiveWindow);

  ipcMain.once(IPC_CHANNELS.window.rendererReady, () => {
    rendererReady = true;
    tryShowMainWindow();
  });
};

const registerWindowIpcHandlers = () => {
  nativeTheme.removeListener('updated', emitSystemThemeChanged);
  nativeTheme.on('updated', emitSystemThemeChanged);

  ipcMain.handle(
    IPC_CHANNELS.window.minimize,
    withEventWindow((win) => {
      win.minimize();
    })
  );

  ipcMain.handle(
    IPC_CHANNELS.window.toggleMaximize,
    withEventWindow((win) => {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    })
  );

  ipcMain.handle(
    IPC_CHANNELS.window.close,
    withEventWindow((win) => {
      if (win === mainWindow) {
        if (mainWindowShouldPreventClose()) {
          win.hide();
          return;
        }

        win.close();
        return;
      }

      win.close();
    })
  );

  ipcMain.handle(
    IPC_CHANNELS.window.isMaximized,
    withEventWindow((win) => win.isMaximized(), false)
  );

  ipcMain.handle(IPC_CHANNELS.window.getAppVersion, () => app.getVersion());
  ipcMain.handle(IPC_CHANNELS.window.getSystemLanguage, () => getSystemLanguage());
  ipcMain.handle(IPC_CHANNELS.window.getSystemTheme, () => getSystemTheme());
};

module.exports = {
  applyWindowAppearance,
  createMainWindow,
  getMainWindow,
  registerWindowIpcHandlers,
  showWindow,
};
