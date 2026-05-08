const { contextBridge, ipcRenderer } = require('electron');
const { buildDesktopBridge } = require('../../../../../packages/desktop-bridge/src/desktopBridge.cjs');

const IPC_BOOTSTRAP_CHANNEL = 'app:bootstrap:ipc-channels';
const PROVIDER_CONFIG_BOOTSTRAP_CHANNEL = 'app:bootstrap:provider-config-snapshot';
const INTERFACE_LAYOUT_BOOTSTRAP_CHANNEL = 'app:bootstrap:interface-layout-config-snapshot';
const RUNTIME_ENV_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'OPENAI_BASE_URL',
  'OPENROUTER_API_KEY',
  'OPENROUTER_MODEL',
  'OPENROUTER_BASE_URL',
  'POE_API_KEY',
  'POE_MODEL',
  'POE_BASE_URL',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GOOGLE_GENERATIVE_AI_MODEL',
  'GOOGLE_GENERATIVE_AI_BASE_URL',
  'GROQ_API_KEY',
  'GROQ_MODEL',
  'GROQ_BASE_URL',
  'TOGETHER_API_KEY',
  'TOGETHER_MODEL',
  'TOGETHER_BASE_URL',
  'FIREWORKS_API_KEY',
  'FIREWORKS_MODEL',
  'FIREWORKS_BASE_URL',
  'CEREBRAS_API_KEY',
  'CEREBRAS_MODEL',
  'CEREBRAS_BASE_URL',
  'PERPLEXITY_API_KEY',
  'PERPLEXITY_MODEL',
  'PERPLEXITY_BASE_URL',
  'COHERE_API_KEY',
  'COHERE_MODEL',
  'COHERE_BASE_URL',
  'SAMBANOVA_API_KEY',
  'SAMBANOVA_MODEL',
  'SAMBANOVA_BASE_URL',
  'MISTRAL_API_KEY',
  'MISTRAL_MODEL',
  'MISTRAL_BASE_URL',
  'LONGCAT_API_KEY',
  'LONGCAT_MODEL',
  'LONGCAT_BASE_URL',
  'MODELSCOPE_API_KEY',
  'MODELSCOPE_MODEL',
  'MODELSCOPE_BASE_URL',
  'MODAL_MODEL',
  'MODAL_BASE_URL',
  'OPENADAPTER_API_KEY',
  'OPENADAPTER_MODEL',
  'OPENADAPTER_BASE_URL',
  'OPENCODE_API_KEY',
  'OPENCODE_MODEL',
  'OPENCODE_BASE_URL',
  'OPENAI_COMPATIBLE_API_KEY',
  'OPENAI_COMPATIBLE_MODEL',
  'OPENAI_COMPATIBLE_BASE_URL',
  'XAI_API_KEY',
  'XAI_MODEL',
  'XAI_BASE_URL',
  'DEEPSEEK_API_KEY',
  'DEEPSEEK_MODEL',
  'DEEPSEEK_BASE_URL',
  'GLM_API_KEY',
  'GLM_MODEL',
  'GLM_BASE_URL',
  'MINIMAX_API_KEY',
  'MINIMAX_MODEL',
  'MINIMAX_BASE_URL',
  'MOONSHOT_API_KEY',
  'MOONSHOT_MODEL',
  'MOONSHOT_BASE_URL',
  'TAVILY_API_KEY',
  'TAVILY_SEARCH_DEPTH',
  'TAVILY_MAX_RESULTS',
  'EXA_API_KEY',
  'EXA_MAX_RESULTS',
  'FIRECRAWL_API_KEY',
  'FIRECRAWL_TOPIC',
  'FIRECRAWL_MAX_RESULTS',
  'FIRECRAWL_LOCATION',
  'FIRECRAWL_COUNTRY',
  'FIRECRAWL_SCRAPE_CONTENT',
  'SEARXNG_BASE_URL',
  'SEARXNG_LANGUAGE',
  'SEARXNG_TIME_RANGE',
  'SEARXNG_SAFE_SEARCH',
  'TOOL_CALL_MAX_ROUNDS',
  'MAX_TOOL_CALL_ROUNDS',
];

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
