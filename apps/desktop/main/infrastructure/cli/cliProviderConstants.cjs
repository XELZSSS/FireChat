const CLI_PROVIDER_BY_ID = {
  codex: 'codex',
  'claude-code': 'claudeCode',
};

const DEFAULT_CLI_SETTINGS = {
  codex: {
    enabled: false,
    command: 'codex',
    workingDirectory: '',
  },
  claudeCode: {
    enabled: false,
    command: 'claude',
    workingDirectory: '',
  },
};

const CLI_CHAT_SYSTEM_PROMPT = [
  'You are connected to FireChat as a chat assistant.',
  'Answer the latest user message directly.',
  'Use the same language as the user message.',
  'Do not inspect, summarize, or quote local project files unless the user explicitly asks for it.',
].join('\n');

module.exports = {
  CLI_CHAT_SYSTEM_PROMPT,
  CLI_PROVIDER_BY_ID,
  DEFAULT_CLI_SETTINGS,
};
