import type { SettingsModalState } from '@client/features/settings/presentation/settingsModal/state/reducer';
import { createEmptyIssuesByTab } from '@client/features/settings/presentation/settingsModal/validation/validationHelpers';
import { validateProviderTab } from '@client/features/settings/presentation/settingsModal/validation/validationProvider';
import { pushIssue } from '@client/features/settings/presentation/settingsModal/validation/validationHelpers';
import type {
  SettingsValidationIssue,
  SettingsValidationResult,
} from '@client/features/settings/presentation/settingsModal/validation/validationTypes';
import { parseInterfaceLayoutConfigText } from '@client/features/settings/infrastructure/interfaceLayoutConfig';
import { t } from '@/shared/utils/i18n';

export type {
  SettingsValidationField,
  SettingsValidationIssue,
  SettingsValidationResult,
  SettingsValidationSeverity,
} from '@client/features/settings/presentation/settingsModal/validation/validationTypes';

export const validateSettingsState = (state: SettingsModalState): SettingsValidationResult => {
  const issuesByTab = createEmptyIssuesByTab();
  const issuesByField: Record<string, SettingsValidationIssue[]> = {};

  validateProviderTab(state, issuesByTab, issuesByField);
  try {
    parseInterfaceLayoutConfigText(state.ui.interfaceLayoutConfigText);
  } catch {
    pushIssue(issuesByTab, issuesByField, {
      severity: 'error',
      tab: 'options',
      field: 'options.interfaceLayoutConfig',
      message: t('settings.validation.options.interfaceLayout.invalid'),
    });
  }

  const issues = Object.values(issuesByTab).flat();
  return {
    issues,
    errors: issues.filter((issue) => issue.severity === 'error'),
    warnings: issues.filter((issue) => issue.severity === 'warning'),
    issuesByTab,
    issuesByField,
  };
};


