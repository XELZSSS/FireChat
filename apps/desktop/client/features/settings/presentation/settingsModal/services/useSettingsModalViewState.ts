import { t } from '@/shared/utils/i18n';
import type { SettingsValidationResult } from '@client/features/settings/presentation/settingsModal/validation/validationTypes';

type SettingsControllerViewState = {
  validation: SettingsValidationResult;
  isDirty: boolean;
};

type UseSettingsModalViewStateOptions = {
  validation: SettingsControllerViewState['validation'];
  isDirty: SettingsControllerViewState['isDirty'];
  interactionLockReason?: string | null;
};

export const useSettingsModalViewState = ({
  validation,
  isDirty,
  interactionLockReason = null,
}: UseSettingsModalViewStateOptions) => {
  const hasValidationErrors = validation.errors.length > 0;
  const saveDisabled = !isDirty || hasValidationErrors || !!interactionLockReason;
  const saveHint = interactionLockReason
    ? interactionLockReason
    : !isDirty
      ? t('settings.modal.noChanges')
      : hasValidationErrors
        ? (validation.errors[0]?.message ?? t('settings.modal.info'))
        : t('settings.modal.info');
  const validationSummary = validation.errors.slice(0, 3);
  const validationOverflowCount = Math.max(validation.errors.length - validationSummary.length, 0);

  return {
    saveDisabled,
    saveHint,
    validationSummary,
    validationOverflowCount,
  };
};
