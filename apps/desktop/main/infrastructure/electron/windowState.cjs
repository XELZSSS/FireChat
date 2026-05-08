const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const WINDOW_STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');
const DEFAULT_WINDOW_STATE = { width: 1200, height: 760 };
const MIN_WINDOW_SIZE = { width: 1024, height: 700 };
const WINDOW_STATE_SAVE_DELAY_MS = 250;

const persistWindowState = (bounds, isMaximized) => {
  fs.mkdirSync(path.dirname(WINDOW_STATE_FILE), { recursive: true });
  fs.writeFileSync(
    WINDOW_STATE_FILE,
    JSON.stringify({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
    }),
    'utf8'
  );
};

const loadWindowState = () => {
  try {
    const raw = fs.readFileSync(WINDOW_STATE_FILE, 'utf8');
    return { ...DEFAULT_WINDOW_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_WINDOW_STATE };
  }
};

const loadDefaultWindowState = () => ({ ...DEFAULT_WINDOW_STATE });

const createWindowStateController = ({ isLiveWindow }) => {
  let saveTimer = null;

  const clearWindowStateSaveTimer = () => {
    if (!saveTimer) return;
    clearTimeout(saveTimer);
    saveTimer = null;
  };

  const saveWindowState = (win) => {
    if (!isLiveWindow(win)) return;
    clearWindowStateSaveTimer();
    persistWindowState(win.getBounds(), win.isMaximized());
  };

  const scheduleWindowStateSave = (win) => {
    if (!isLiveWindow(win)) return;
    clearWindowStateSaveTimer();
    saveTimer = setTimeout(() => {
      saveTimer = null;
      if (!isLiveWindow(win)) return;
      persistWindowState(win.getBounds(), win.isMaximized());
    }, WINDOW_STATE_SAVE_DELAY_MS);
  };

  return {
    clearWindowStateSaveTimer,
    loadWindowState,
    saveWindowState,
    scheduleWindowStateSave,
  };
};

module.exports = {
  MIN_WINDOW_SIZE,
  createWindowStateController,
  loadDefaultWindowState,
};
