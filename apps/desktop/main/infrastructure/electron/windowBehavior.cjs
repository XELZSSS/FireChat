const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const WINDOW_BEHAVIOR_FILE = path.join(app.getPath('userData'), 'window-behavior.json');

const DEFAULT_WINDOW_BEHAVIOR = {
  closeToTray: true,
  minimizeToTray: false,
  launchAtStartup: false,
  startMinimizedToTray: false,
  rememberWindowBounds: true,
};

const normalizeWindowBehavior = (value) => {
  const record = value && typeof value === 'object' ? value : {};
  return {
    closeToTray:
      typeof record.closeToTray === 'boolean'
        ? record.closeToTray
        : DEFAULT_WINDOW_BEHAVIOR.closeToTray,
    minimizeToTray:
      typeof record.minimizeToTray === 'boolean'
        ? record.minimizeToTray
        : DEFAULT_WINDOW_BEHAVIOR.minimizeToTray,
    launchAtStartup:
      typeof record.launchAtStartup === 'boolean'
        ? record.launchAtStartup
        : DEFAULT_WINDOW_BEHAVIOR.launchAtStartup,
    startMinimizedToTray:
      typeof record.startMinimizedToTray === 'boolean'
        ? record.startMinimizedToTray
        : DEFAULT_WINDOW_BEHAVIOR.startMinimizedToTray,
    rememberWindowBounds:
      typeof record.rememberWindowBounds === 'boolean'
        ? record.rememberWindowBounds
        : DEFAULT_WINDOW_BEHAVIOR.rememberWindowBounds,
  };
};

const syncLoginItemSettings = (value) => {
  if (process.platform !== 'win32' && process.platform !== 'darwin') {
    return;
  }

  app.setLoginItemSettings({
    openAtLogin: value.launchAtStartup,
    openAsHidden: value.startMinimizedToTray,
    args: value.startMinimizedToTray ? ['--hidden'] : [],
  });
};

const readWindowBehavior = () => {
  try {
    const raw = fs.readFileSync(WINDOW_BEHAVIOR_FILE, 'utf8');
    return normalizeWindowBehavior(JSON.parse(raw));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return DEFAULT_WINDOW_BEHAVIOR;
    }

    throw error;
  }
};

const writeWindowBehavior = (value) => {
  const nextValue = normalizeWindowBehavior(value);
  fs.mkdirSync(path.dirname(WINDOW_BEHAVIOR_FILE), { recursive: true });
  fs.writeFileSync(WINDOW_BEHAVIOR_FILE, JSON.stringify(nextValue, null, 2), 'utf8');
  syncLoginItemSettings(nextValue);
  return nextValue;
};

const shouldCloseToTray = () => readWindowBehavior().closeToTray;
const shouldMinimizeToTray = () => readWindowBehavior().minimizeToTray;
const shouldRememberWindowBounds = () => readWindowBehavior().rememberWindowBounds;
const shouldStartMinimizedToTray = () =>
  readWindowBehavior().startMinimizedToTray && process.argv.includes('--hidden');

module.exports = {
  WINDOW_BEHAVIOR_FILE,
  readWindowBehavior,
  writeWindowBehavior,
  shouldCloseToTray,
  shouldMinimizeToTray,
  shouldRememberWindowBounds,
  shouldStartMinimizedToTray,
};
