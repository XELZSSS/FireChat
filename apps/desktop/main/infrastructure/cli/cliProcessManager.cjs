const { CodexAppServer } = require('./codexAppServer.cjs');
const { DEFAULT_CLI_SETTINGS } = require('./cliProviderConstants.cjs');
const { ClaudeCodeRunner } = require('./claudeCodeRunner.cjs');
const { resolveWorkingDirectory } = require('./cliProcess.cjs');
const {
  cloneCliSettings,
  copyCliStatus,
  createCliStatus,
  createCliStatusMap,
  normalizeCliSettings,
  toProviderKey,
} = require('./cliSettings.cjs');
const { normalizeSessionId } = require('./cliSessionFiles.cjs');

let runtimeSettings = cloneCliSettings(DEFAULT_CLI_SETTINGS);
let runtimeStatus = createCliStatusMap(runtimeSettings);
let codexServer = null;

const setProviderStatus = (key, updates) => {
  runtimeStatus = {
    ...runtimeStatus,
    [key]: {
      ...runtimeStatus[key],
      enabled: Boolean(runtimeSettings[key].enabled),
      ...updates,
    },
  };
};

const copyStatus = () => copyCliStatus(runtimeStatus);

const claudeCodeRunner = new ClaudeCodeRunner({
  getSettings: () => runtimeSettings.claudeCode,
  setStatus: (updates) => setProviderStatus('claudeCode', updates),
});

const createCodexServer = () =>
  new CodexAppServer({
    settings: runtimeSettings.codex,
    setStatus: (updates) => setProviderStatus('codex', updates),
    getEnabled: () => runtimeSettings.codex.enabled,
    onExit: (server) => {
      if (codexServer === server) {
        codexServer = null;
      }
    },
  });

const ensureCodexServer = async () => {
  if (!runtimeSettings.codex.enabled) {
    throw new Error('Codex CLI is disabled.');
  }
  if (codexServer) {
    setProviderStatus('codex', {
      running: true,
      connected: true,
      status: codexServer.activeTurn ? 'running' : 'connected',
      message: undefined,
    });
    return codexServer;
  }

  codexServer = createCodexServer();
  try {
    await codexServer.start();
    return codexServer;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    codexServer?.stop();
    codexServer = null;
    setProviderStatus('codex', {
      running: false,
      connected: false,
      status: 'error',
      message,
    });
    throw error;
  }
};

const ensureCodexServerForMaintenance = async () => {
  if (codexServer) {
    return { server: codexServer, temporary: false };
  }

  const server = createCodexServer();
  try {
    await server.start();
    if (runtimeSettings.codex.enabled) {
      codexServer = server;
      return { server, temporary: false };
    }
    return { server, temporary: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    server.stop();
    setProviderStatus('codex', {
      running: false,
      connected: false,
      status: 'error',
      message,
    });
    throw error;
  }
};

async function syncCliProviderConfig(payload) {
  const nextSettings = normalizeCliSettings(payload);
  const shouldRestartCodex =
    codexServer &&
    (runtimeSettings.codex.command !== nextSettings.codex.command ||
      runtimeSettings.codex.workingDirectory !== nextSettings.codex.workingDirectory);
  const shouldStopCodex = runtimeSettings.codex.enabled && !nextSettings.codex.enabled;
  const shouldStopClaude = runtimeSettings.claudeCode.enabled && !nextSettings.claudeCode.enabled;

  runtimeSettings = nextSettings;

  if (shouldRestartCodex || shouldStopCodex) {
    codexServer?.stop();
    codexServer = null;
  }
  if (shouldStopClaude && claudeCodeRunner.isRunning()) {
    claudeCodeRunner.stop();
  }

  setProviderStatus('codex', createCliStatus(runtimeSettings, 'codex'));
  setProviderStatus('claudeCode', createCliStatus(runtimeSettings, 'claudeCode'));

  if (runtimeSettings.codex.enabled) {
    await ensureCodexServer();
  }
  if (runtimeSettings.claudeCode.enabled) {
    setProviderStatus('claudeCode', {
      running: claudeCodeRunner.isRunning(),
      connected: true,
      status: claudeCodeRunner.isRunning() ? 'running' : 'connected',
      message: undefined,
    });
  }

  return copyStatus();
}

function getCliProviderStatus() {
  return copyStatus();
}

async function runCliPrompt(payload) {
  const provider = String(payload?.provider ?? '').trim();
  const prompt = String(payload?.prompt ?? '').trim();
  if (!prompt) {
    throw new Error('Prompt is required.');
  }

  const key = toProviderKey(provider);
  if (key === 'codex') {
    const server = await ensureCodexServer();
    return server.runPrompt({
      prompt,
      model: payload?.model,
      sessionId: payload?.sessionId,
      workingDirectory: payload?.workingDirectory,
    });
  }

  return claudeCodeRunner.runPrompt({
    prompt,
    model: payload?.model,
    sessionId: payload?.sessionId,
    workingDirectory: payload?.workingDirectory,
  });
}

async function stopCliProvider(providerId) {
  const key = toProviderKey(String(providerId ?? '').trim());
  if (key === 'codex') {
    codexServer?.stop();
    codexServer = null;
  }
  if (key === 'claudeCode' && claudeCodeRunner.isRunning()) {
    claudeCodeRunner.stop();
  }

  setProviderStatus(key, {
    running: false,
    connected: Boolean(runtimeSettings[key].enabled),
    status: runtimeSettings[key].enabled ? 'connected' : 'disabled',
    message: undefined,
  });
  return copyStatus();
}

async function archiveCodexCliSession(threadId) {
  const normalizedThreadId = normalizeSessionId(threadId);
  if (!normalizedThreadId) {
    return { ok: true, action: 'skipped' };
  }

  let maintenance = null;
  try {
    maintenance = await ensureCodexServerForMaintenance();
    const cwd = resolveWorkingDirectory(runtimeSettings.codex.workingDirectory);
    await maintenance.server.archiveThread(normalizedThreadId, cwd);
    return { ok: true, action: 'archived' };
  } catch (error) {
    return {
      ok: false,
      action: 'skipped',
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (maintenance?.temporary) {
      maintenance.server.stop();
      setProviderStatus('codex', createCliStatus(runtimeSettings, 'codex'));
    }
  }
}

async function cleanupCliSessions(payload) {
  const result = {};
  const codexThreadId = normalizeSessionId(payload?.codex);
  const claudeCodeSessionId = normalizeSessionId(payload?.claudeCode);

  if (codexThreadId) {
    result.codex = await archiveCodexCliSession(codexThreadId);
  }
  if (claudeCodeSessionId) {
    result.claudeCode = claudeCodeRunner.deleteSession(claudeCodeSessionId);
  }

  return result;
}

async function stopAllCliProviders() {
  codexServer?.stop();
  codexServer = null;
  if (claudeCodeRunner.isRunning()) {
    claudeCodeRunner.stop();
  }
  setProviderStatus('codex', {
    running: false,
    connected: false,
    status: 'disabled',
  });
  setProviderStatus('claudeCode', {
    running: false,
    connected: false,
    status: 'disabled',
  });
}

module.exports = {
  cleanupCliSessions,
  getCliProviderStatus,
  runCliPrompt,
  stopAllCliProviders,
  stopCliProvider,
  syncCliProviderConfig,
};
