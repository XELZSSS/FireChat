const { CLI_CHAT_SYSTEM_PROMPT } = require('./cliProviderConstants.cjs');
const { deleteClaudeCodeCliSession, hasClaudeCodeCliSession } = require('./cliSessionFiles.cjs');
const { resolveWorkingDirectory, spawnHidden, terminateProcessTree } = require('./cliProcess.cjs');

const parseClaudeJsonOutput = (stdout) => {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error('Claude Code CLI returned an empty response.');
  }

  let payload;
  try {
    payload = JSON.parse(trimmed);
  } catch {
    throw new Error('Claude Code CLI returned invalid JSON.');
  }

  if (payload?.is_error) {
    throw new Error(String(payload.result || 'Claude Code CLI request failed.'));
  }

  if (typeof payload?.result !== 'string') {
    throw new Error('Claude Code CLI response did not contain result text.');
  }

  return {
    text: payload.result,
    sessionId: typeof payload.session_id === 'string' ? payload.session_id : undefined,
  };
};

class ClaudeCodeRunner {
  constructor({ getSettings, setStatus }) {
    this.getSettings = getSettings;
    this.setStatus = setStatus;
    this.activeProcess = null;
    this.knownSessionIds = new Set();
  }

  isRunning() {
    return Boolean(this.activeProcess);
  }

  stop() {
    terminateProcessTree(this.activeProcess);
    this.activeProcess = null;
  }

  deleteSession(sessionId) {
    return deleteClaudeCodeCliSession(sessionId, this.knownSessionIds);
  }

  buildArgs(payload) {
    const model = String(payload.model ?? '').trim();
    const sessionId = String(payload.sessionId ?? '').trim();
    const args = [
      '-p',
      payload.prompt,
      '--output-format',
      'json',
      '--append-system-prompt',
      CLI_CHAT_SYSTEM_PROMPT,
      '--max-turns',
      '1',
      '--disallowedTools',
      'Read,Grep,Glob,Bash,Edit,Write',
      '--permission-mode',
      'dontAsk',
    ];

    if (sessionId) {
      args.push(
        hasClaudeCodeCliSession(sessionId, this.knownSessionIds) ? '--resume' : '--session-id',
        sessionId
      );
    }
    if (model && model !== 'claude-code') {
      args.push('--model', model);
    }

    return { args, sessionId };
  }

  runPrompt(payload) {
    const settings = this.getSettings();
    if (!settings.enabled) {
      throw new Error('Claude Code CLI is disabled.');
    }
    if (this.activeProcess) {
      throw new Error('Claude Code CLI is already running a prompt.');
    }

    const cwd = resolveWorkingDirectory(payload.workingDirectory || settings.workingDirectory);
    const { args, sessionId } = this.buildArgs(payload);

    this.setStatus({
      running: true,
      connected: true,
      status: 'running',
      message: undefined,
    });

    return new Promise((resolve, reject) => {
      const output = {
        stdout: '',
        stderr: '',
      };

      let child;
      try {
        child = spawnHidden(settings.command, args, {
          cwd,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (error) {
        this.setStatus({
          running: false,
          connected: false,
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
        reject(error);
        return;
      }

      this.activeProcess = child;
      child.stdout.on('data', (chunk) => {
        output.stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        output.stderr += chunk.toString();
      });
      child.once('error', (error) => {
        this.activeProcess = null;
        this.setStatus({
          running: false,
          connected: false,
          status: 'error',
          message: error.message,
        });
        reject(error);
      });
      child.once('exit', (code) => {
        this.handleExit({ code, output, reject, resolve, sessionId });
      });
    });
  }

  handleExit({ code, output, reject, resolve, sessionId }) {
    this.activeProcess = null;
    if (code && code !== 0) {
      const message = output.stderr.trim() || `Claude Code CLI exited with code ${code}.`;
      this.setStatus({
        running: false,
        connected: false,
        status: 'error',
        message,
      });
      reject(new Error(message));
      return;
    }

    try {
      const result = parseClaudeJsonOutput(output.stdout);
      const nextSessionId = sessionId || result.sessionId || undefined;
      if (nextSessionId) {
        this.knownSessionIds.add(nextSessionId);
      }
      this.setStatus({
        running: false,
        connected: true,
        status: 'connected',
        message: undefined,
      });
      resolve({
        text: result.text,
        sessionId: nextSessionId,
      });
    } catch (error) {
      this.setStatus({
        running: false,
        connected: true,
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
      reject(error);
    }
  }
}

module.exports = {
  ClaudeCodeRunner,
};
