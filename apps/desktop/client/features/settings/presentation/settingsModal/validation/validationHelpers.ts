import type { ActiveSettingsTab } from '@client/features/settings/presentation/settingsModal/state/reducer';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validationTypes';

export const createEmptyIssuesByTab = (): Record<ActiveSettingsTab, SettingsValidationIssue[]> => ({
  provider: [],
  customProvider: [],
  aiGateway: [],
  cli: [],
  mcp: [],
  imageGeneration: [],
  search: [],
  requestLogs: [],
  pet: [],
  options: [],
});

export const parseHttpUrl = (value: string): URL | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const baseOrigin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost';
    const url =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? new URL(trimmed)
        : new URL(trimmed, baseOrigin);

    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
};

export const pushIssue = (
  issuesByTab: Record<ActiveSettingsTab, SettingsValidationIssue[]>,
  issuesByField: Record<string, SettingsValidationIssue[]>,
  issue: SettingsValidationIssue
): void => {
  issuesByTab[issue.tab].push(issue);
  if (issue.field) {
    issuesByField[issue.field] = [...(issuesByField[issue.field] ?? []), issue];
  }
};
