const { contextBridge, ipcRenderer } = require('electron');
const {
  buildDesktopBridge,
} = require('../../../../../packages/desktop-bridge/src/desktopBridge.cjs');
const IPC_BOOTSTRAP_CHANNEL = 'app:bootstrap:ipc-channels';
const PROVIDER_CONFIG_BOOTSTRAP_CHANNEL = 'app:bootstrap:provider-config-snapshot';
const INTERFACE_LAYOUT_BOOTSTRAP_CHANNEL = 'app:bootstrap:interface-layout-config-snapshot';
const RUNTIME_ENV_KEYS = require('../../../../../apps/shared/runtime-env-keys.cjs').FIRECHAT_RUNTIME_ENV_KEYS;

const PRELOAD_CONSOLE_INSTALL_MARK = '__firechat_preload_console_style_installed__';
const PRELOAD_BADGE_STYLE =
  'background:#1f2937;color:#f8fafc;padding:2px 8px;border-radius: 0;font-weight:700;';
const PRELOAD_SCOPE_STYLE = 'color:#94a3b8;font-weight:600;';
const PRELOAD_BODY_STYLE = 'color:inherit;';
const PRELOAD_LEVEL_THEME = {
  log: { label: 'LOG', color: '#7dd3fc' },
  info: { label: 'INFO', color: '#60a5fa' },
  warn: { label: 'WARN', color: '#fbbf24' },
  error: { label: 'ERROR', color: '#f87171' },
  debug: { label: 'DEBUG', color: '#c084fc' },
};

const installPreloadConsoleStyle = () => {
  const target = console;
  if (target[PRELOAD_CONSOLE_INSTALL_MARK]) return;

  Object.defineProperty(target, PRELOAD_CONSOLE_INSTALL_MARK, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  for (const method of ['log', 'info', 'warn', 'error', 'debug']) {
    const original =
      typeof target[method] === 'function' ? target[method].bind(target) : target.log.bind(target);
    const theme = PRELOAD_LEVEL_THEME[method] ?? PRELOAD_LEVEL_THEME.log;

    target[method] = (...args) => {
      const template = `%c FireChat %c preload %c ${theme.label} %c`;

      if (args.length === 0) {
        original(
          template,
          PRELOAD_BADGE_STYLE,
          PRELOAD_SCOPE_STYLE,
          `color:${theme.color};font-weight:700;`,
          PRELOAD_BODY_STYLE
        );
        return;
      }

      if (typeof args[0] === 'string') {
        original(
          `${template}${args[0]}`,
          PRELOAD_BADGE_STYLE,
          PRELOAD_SCOPE_STYLE,
          `color:${theme.color};font-weight:700;`,
          PRELOAD_BODY_STYLE,
          ...args.slice(1)
        );
        return;
      }

      original(
        template,
        PRELOAD_BADGE_STYLE,
        PRELOAD_SCOPE_STYLE,
        `color:${theme.color};font-weight:700;`,
        PRELOAD_BODY_STYLE,
        ...args
      );
    };
  }
};

installPreloadConsoleStyle();

const IPC_CHANNELS = ipcRenderer.sendSync(IPC_BOOTSTRAP_CHANNEL);
const PROVIDER_FILE_SNAPSHOT = ipcRenderer.sendSync(PROVIDER_CONFIG_BOOTSTRAP_CHANNEL);
const INTERFACE_LAYOUT_CONFIG = ipcRenderer.sendSync(INTERFACE_LAYOUT_BOOTSTRAP_CHANNEL);

if (!IPC_CHANNELS) {
  throw new Error('Failed to load IPC channel bootstrap payload in preload.');
}

const subscribeMaximizeChanged = (callback) => {
  const onMax = () => callback(true);
  const onUnmax = () => callback(false);
  ipcRenderer.on(IPC_CHANNELS.window.maximize, onMax);
  ipcRenderer.on(IPC_CHANNELS.window.unmaximize, onUnmax);
  return () => {
    ipcRenderer.removeListener(IPC_CHANNELS.window.maximize, onMax);
    ipcRenderer.removeListener(IPC_CHANNELS.window.unmaximize, onUnmax);
  };
};

const buildRuntimeEnv = () => {
  const env = {};
  for (const key of RUNTIME_ENV_KEYS) {
    if (typeof process.env[key] === 'string') {
      env[key] = process.env[key];
    }
  }
  return env;
};

globalThis.addEventListener('firechat-renderer-ready', () => {
  ipcRenderer.send(IPC_CHANNELS.window.rendererReady);
});

contextBridge.exposeInMainWorld(
  'firechat',
  buildDesktopBridge({
    ipcRenderer,
    channels: IPC_CHANNELS,
    runtimeEnv: buildRuntimeEnv(),
    providerFileSnapshot: PROVIDER_FILE_SNAPSHOT,
    interfaceLayoutConfig: INTERFACE_LAYOUT_CONFIG,
    subscribeMaximizeChanged,
  })
);
