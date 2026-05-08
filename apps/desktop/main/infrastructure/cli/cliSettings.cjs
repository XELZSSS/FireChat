const { CLI_PROVIDER_BY_ID, DEFAULT_CLI_SETTINGS } = require('./cliProviderConstants.cjs');

const cloneProviderSettings = (settings, defaults) => ({
  enabled: Boolean(settings?.enabled),
  command: String(settings?.command ?? defaults.command).trim(),
  workingDirectory: String(settings?.workingDirectory ?? '').trim(),
});

const cloneCliSettings = (settings) => ({
  codex: cloneProviderSettings(settings?.codex, DEFAULT_CLI_SETTINGS.codex),
  claudeCode: cloneProviderSettings(settings?.claudeCode, DEFAULT_CLI_SETTINGS.claudeCode),
});

const normalizeCliSettings = (payload) => {
  const next = cloneCliSettings(payload);

  if (!next.codex.command) {
    next.codex.command = DEFAULT_CLI_SETTINGS.codex.command;
  }
  if (!next.claudeCode.command) {
    next.claudeCode.command = DEFAULT_CLI_SETTINGS.claudeCode.command;
  }

  return next;
};

const toProviderKey = (providerId) => {
  const key = CLI_PROVIDER_BY_ID[providerId];
  if (!key) {
    throw new Error(`Unsupported CLI provider: ${providerId}`);
  }
  return key;
};

const createCliStatus = (settings, key, overrides = {}) => ({
  enabled: Boolean(settings[key].enabled),
  running: false,
  connected: false,
  status: settings[key].enabled ? 'stopped' : 'disabled',
  ...overrides,
});

const createCliStatusMap = (settings) => ({
  codex: createCliStatus(settings, 'codex'),
  claudeCode: createCliStatus(settings, 'claudeCode'),
});

const copyCliStatus = (status) => ({
  codex: { ...status.codex },
  claudeCode: { ...status.claudeCode },
});

module.exports = {
  cloneCliSettings,
  copyCliStatus,
  createCliStatus,
  createCliStatusMap,
  normalizeCliSettings,
  toProviderKey,
};
