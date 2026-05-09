import { t } from '@/shared/utils/i18n';
import { isValidAiGatewayBaseUrl } from '@/infrastructure/providers/aiGatewaySettings';
import type {
  ActiveSettingsTab,
  SettingsModalState,
} from '@client/features/settings/presentation/settingsModal/state/reducer';
import { pushIssue } from '@client/features/settings/presentation/settingsModal/validation/validationHelpers';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validationTypes';

export const validateAiGatewayTab = (
  state: SettingsModalState,
  issuesByTab: Record<ActiveSettingsTab, SettingsValidationIssue[]>,
  issuesByField: Record<string, SettingsValidationIssue[]>
): void => {
  if (!state.app.aiGateway.enabled) {
    return;
  }

  if (!isValidAiGatewayBaseUrl(state.app.aiGateway.baseUrl)) {
    pushIssue(issuesByTab, issuesByField, {
      severity: 'error',
      tab: 'aiGateway',
      field: 'aiGateway.baseUrl',
      message: t('settings.validation.aiGateway.baseUrl.invalid'),
    });
  }
};
