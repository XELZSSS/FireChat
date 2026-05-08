import type {
  CliProviderConnectionSettings,
  CliProviderId,
  CliSettings,
} from '@contracts/desktop';
import { isPlainObject } from '@/infrastructure/persistence/jsonBackedStore';

const DEFAULT_CODEX_COMMAND = 'codex';
const DEFAULT_CLAUDE_CODE_COMMAND = 'claude';

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.trim();
};

const normalizeConnectionSettings = (
  value: unknown,
  current: CliProviderConnectionSettings,
  defaults: CliProviderConnectionSettings
): CliProviderConnectionSettings => {
  const raw = isPlainObject(value) ? value : {};
  const command = normalizeText(raw.command);
  const workingDirectory = normalizeText(raw.workingDirectory);

  return {
    enabled:
      typeof raw.enabled === 'boolean' ? raw.enabled : (current.enabled ?? defaults.enabled),
    command: command || current.command || defaults.command,
    workingDirectory:
      workingDirectory !== undefined
        ? workingDirectory
        : (current.workingDirectory ?? defaults.workingDirectory),
  };
};

export const getDefaultCliSettings = (): CliSettings => ({
  codex: {
    enabled: false,
    command: DEFAULT_CODEX_COMMAND,
    workingDirectory: '',
  },
  claudeCode: {
    enabled: false,
    command: DEFAULT_CLAUDE_CODE_COMMAND,
    workingDirectory: '',
  },
});

export const normalizeCliSettings = (
  value: unknown,
  currentSettings: Partial<CliSettings> = {}
): CliSettings => {
  const defaults = getDefaultCliSettings();
  const raw = isPlainObject(value) ? value : {};
  const codex = normalizeConnectionSettings(
    raw.codex,
    currentSettings.codex ?? defaults.codex,
    defaults.codex
  );
  const claudeCode = normalizeConnectionSettings(
    raw.claudeCode,
    currentSettings.claudeCode ?? defaults.claudeCode,
    defaults.claudeCode
  );

  if (codex.enabled && claudeCode.enabled) {
    claudeCode.enabled = false;
  }

  return {
    codex,
    claudeCode,
  };
};

export const areCliSettingsEqual = (left: CliSettings, right: CliSettings): boolean =>
  left.codex.enabled === right.codex.enabled &&
  left.codex.command === right.codex.command &&
  left.codex.workingDirectory === right.codex.workingDirectory &&
  left.claudeCode.enabled === right.claudeCode.enabled &&
  left.claudeCode.command === right.claudeCode.command &&
  left.claudeCode.workingDirectory === right.claudeCode.workingDirectory;

export const getActiveCliProviderId = (settings: CliSettings): CliProviderId | null => {
  if (settings.codex.enabled) {
    return 'codex';
  }

  if (settings.claudeCode.enabled) {
    return 'claude-code';
  }

  return null;
};
