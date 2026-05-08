const readline = require('readline');
const {
  extractCodexCompletedText,
  extractCodexDelta,
  isCodexAppNotification,
  isCodexAppResponse,
  isCodexAppServerRequest,
  parseCodexAppMessage,
  resolveCodexTurnId,
} = require('./codexAppProtocol.cjs');
const { CLI_CHAT_SYSTEM_PROMPT } = require('./cliProviderConstants.cjs');
const { resolveWorkingDirectory, spawnHidden, terminateProcessTree } = require('./cliProcess.cjs');

class CodexAppServer {
  constructor({ settings, setStatus, getEnabled, onExit }) {
    this.settings = settings;
    this.setStatus = setStatus;
    this.getEnabled = getEnabled;
    this.onExit = onExit;
    this.process = null;
    this.reader = null;
    this.nextId = 1;
    this.pending = new Map();
    this.activeTurn = null;
    this.loadedThreadIds = new Set();
    this.stderr = '';
  }

  async start() {
    const cwd = resolveWorkingDirectory(this.settings.workingDirectory);
    this.setStatus({
      running: true,
      connected: false,
      status: 'starting',
      message: undefined,
    });

    this.process = spawnHidden(this.settings.command, ['app-server'], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process.stderr.on('data', (chunk) => {
      this.stderr += chunk.toString();
    });
    this.process.once('exit', () => this.handleExit());

    this.reader = readline.createInterface({ input: this.process.stdout });
    this.reader.on('line', (line) => this.handleLine(line));

    await this.request('initialize', {
      clientInfo: {
        name: 'FireChat',
        title: 'FireChat',
        version: '0.0.0',
      },
      capabilities: {
        experimentalApi: true,
        optOutNotificationMethods: ['item/agentMessage/delta'],
      },
    });
    this.notify('initialized', {});

    this.setStatus({
      running: true,
      connected: true,
      status: 'connected',
      message: undefined,
    });
  }

  handleExit() {
    const error = new Error(this.stderr.trim() || 'Codex CLI process exited.');
    this.rejectAllPending(error);
    this.rejectActiveTurn(error);
    this.setStatus({
      running: false,
      connected: false,
      status: this.getEnabled() ? 'stopped' : 'disabled',
    });
    this.onExit(this);
  }

  stop() {
    this.reader?.close();
    this.reader = null;
    terminateProcessTree(this.process);
    this.process = null;
    const error = new Error('Codex CLI process was stopped.');
    this.rejectAllPending(error);
    this.rejectActiveTurn(error);
  }

  rejectAllPending(error) {
    for (const pending of this.pending.values()) {
      pending.reject(error);
    }
    this.pending.clear();
  }

  rejectActiveTurn(error) {
    if (!this.activeTurn) {
      return;
    }
    this.activeTurn.reject(error);
    this.activeTurn = null;
  }

  buildThreadConfig(cwd, requestedModel) {
    return {
      ...(requestedModel && requestedModel !== 'codex' ? { model: requestedModel } : {}),
      cwd,
      approvalPolicy: 'never',
      developerInstructions: CLI_CHAT_SYSTEM_PROMPT,
      personality: 'none',
    };
  }

  async startThread(cwd, requestedModel) {
    const result = await this.request('thread/start', this.buildThreadConfig(cwd, requestedModel));
    const threadId = result?.thread?.id;
    if (!threadId) {
      throw new Error('Codex CLI did not return a thread id.');
    }

    this.loadedThreadIds.add(threadId);
    return threadId;
  }

  async resumeThread(threadId, cwd, requestedModel) {
    if (this.loadedThreadIds.has(threadId)) {
      return threadId;
    }

    const result = await this.request('thread/resume', {
      threadId,
      ...this.buildThreadConfig(cwd, requestedModel),
      excludeTurns: true,
    });
    const resumedThreadId = result?.thread?.id || threadId;
    this.loadedThreadIds.add(resumedThreadId);
    return resumedThreadId;
  }

  async archiveThread(threadId, cwd) {
    if (this.activeTurn) {
      throw new Error('Codex CLI is already running a prompt.');
    }

    if (!this.loadedThreadIds.has(threadId)) {
      await this.resumeThread(threadId, cwd, '');
    }
    await this.request('thread/archive', { threadId });
    this.loadedThreadIds.delete(threadId);
  }

  send(payload) {
    if (!this.process?.stdin?.writable) {
      throw new Error('Codex CLI process is not writable.');
    }
    this.process.stdin.write(`${JSON.stringify(payload)}\n`);
  }

  request(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      try {
        this.send({ id, method, params });
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  notify(method, params) {
    this.send({ method, params });
  }

  respond(id, result) {
    this.send({ id, result });
  }

  rejectServerRequest(id, message) {
    this.send({
      id,
      error: {
        code: -32601,
        message,
      },
    });
  }

  handleLine(line) {
    const message = parseCodexAppMessage(line);
    if (!message) {
      return;
    }

    if (isCodexAppResponse(message)) {
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message || 'Codex CLI request failed.'));
        return;
      }
      pending.resolve(message.result);
      return;
    }

    if (isCodexAppServerRequest(message)) {
      this.handleServerRequest(message);
      return;
    }

    if (isCodexAppNotification(message)) {
      this.handleNotification(message.method, message.params);
    }
  }

  handleServerRequest(message) {
    if (
      message.method === 'item/commandExecution/requestApproval' ||
      message.method === 'item/fileChange/requestApproval'
    ) {
      this.respond(message.id, { decision: 'decline' });
      return;
    }

    this.rejectServerRequest(message.id, 'Unsupported Codex app-server request.');
  }

  handleNotification(method, params) {
    if (!this.activeTurn) {
      return;
    }

    const turnId = resolveCodexTurnId(params);
    if (turnId && this.activeTurn.turnId && turnId !== this.activeTurn.turnId) {
      return;
    }

    if (method === 'item/agentMessage/delta') {
      const delta = extractCodexDelta(params);
      if (delta) {
        this.activeTurn.chunks.push(delta);
      }
      return;
    }

    if (method === 'item/completed') {
      const completedText = extractCodexCompletedText(params);
      if (completedText) {
        this.activeTurn.completedText = completedText;
      }
      return;
    }

    if (method === 'turn/completed') {
      this.completeTurn(params);
    }
  }

  completeTurn(params) {
    const turn = params?.turn && typeof params.turn === 'object' ? params.turn : undefined;
    const status = typeof turn?.status === 'string' ? turn.status : 'completed';
    const errorMessage = typeof turn?.error?.message === 'string' ? turn.error.message : undefined;
    const activeTurn = this.activeTurn;
    this.activeTurn = null;
    this.setStatus({
      running: true,
      connected: true,
      status: 'connected',
      message: undefined,
    });

    if (status === 'failed' || errorMessage) {
      activeTurn.reject(new Error(errorMessage || 'Codex CLI turn failed.'));
      return;
    }

    activeTurn.resolve(activeTurn.completedText || activeTurn.chunks.join(''));
  }

  async runPrompt(payload) {
    if (this.activeTurn) {
      throw new Error('Codex CLI is already running a prompt.');
    }

    const cwd = resolveWorkingDirectory(payload.workingDirectory || this.settings.workingDirectory);
    const requestedModel = String(payload.model ?? '').trim();
    const existingThreadId = String(payload.sessionId ?? '').trim();
    const threadId = existingThreadId
      ? await this.resumeThread(existingThreadId, cwd, requestedModel)
      : await this.startThread(cwd, requestedModel);

    this.setStatus({
      running: true,
      connected: true,
      status: 'running',
      message: undefined,
    });

    const turnPromise = new Promise((resolve, reject) => {
      this.activeTurn = {
        turnId: undefined,
        chunks: [],
        completedText: '',
        resolve,
        reject,
      };
    });

    try {
      const turnResult = await this.request('turn/start', {
        threadId,
        input: [{ type: 'text', text: payload.prompt }],
        cwd,
        ...(requestedModel && requestedModel !== 'codex' ? { model: requestedModel } : {}),
        approvalPolicy: 'never',
        sandboxPolicy: {
          type: 'readOnly',
          networkAccess: false,
        },
        personality: 'none',
      });
      if (this.activeTurn) {
        this.activeTurn.turnId = turnResult?.turn?.id;
      }
    } catch (error) {
      this.rejectActiveTurn(error);
      this.setStatus({
        running: true,
        connected: true,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    return {
      text: await turnPromise,
      sessionId: threadId,
    };
  }
}

module.exports = {
  CodexAppServer,
};
