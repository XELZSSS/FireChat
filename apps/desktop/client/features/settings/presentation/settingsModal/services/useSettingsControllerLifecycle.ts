import { useCallback, useMemo, useState } from 'react';
import { buildSettingsSavePayload } from '@client/features/settings/presentation/settingsModal/actions/controllerHelpers';
import {
  SettingsModalState,
  type ActiveSettingsTab,
} from '@client/features/settings/presentation/settingsModal/state/reducer';
import { validateSettingsState } from '@client/features/settings/presentation/settingsModal/validation/validation';
import type { SaveSettingsPayload } from '@client/features/settings/domain/settingsTypes';
import { areComparableValuesEqual } from '@/shared/utils/comparable';

type UiFieldSetter = <K extends keyof SettingsModalState['ui']>(
  key: K,
  value: SettingsModalState['ui'][K]
) => void;

type UseSettingsControllerLifecycleOptions = {
  onClose: () => void;
  onSave: (value: SaveSettingsPayload) => void | Promise<void>;
  saveBlockedReason?: string | null;
  state: SettingsModalState;
  stateSeed: SettingsModalState;
  setUiField: UiFieldSetter;
};

export const useSettingsControllerLifecycle = ({
  onClose,
  onSave,
  saveBlockedReason = null,
  state,
  stateSeed,
  setUiField,
}: UseSettingsControllerLifecycleOptions) => {
  const validation = useMemo(() => validateSettingsState(state), [state]);
  const isDirty = useMemo(() => !areComparableValuesEqual(state, stateSeed), [state, stateSeed]);

  const [showDiscardChangesPrompt, setShowDiscardChangesPrompt] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const requestClose = useCallback(() => {
    if (!isDirty) {
      setShowDiscardChangesPrompt(false);
      setShowValidationSummary(false);
      onClose();
      return;
    }

    setShowDiscardChangesPrompt(true);
  }, [isDirty, onClose]);

  const confirmDiscardChanges = useCallback(() => {
    setShowDiscardChangesPrompt(false);
    onClose();
  }, [onClose]);

  const cancelDiscardChanges = useCallback(() => {
    setShowDiscardChangesPrompt(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (saveBlockedReason || !isDirty) {
      return;
    }

    if (validation.errors.length > 0) {
      setShowValidationSummary(true);
      const firstErrorTab = validation.errors[0]?.tab;
      if (firstErrorTab && firstErrorTab !== state.ui.activeTab) {
        setUiField('activeTab', firstErrorTab as ActiveSettingsTab);
      }
      return;
    }

    setShowValidationSummary(false);
    try {
      await Promise.resolve(onSave(buildSettingsSavePayload(state)));
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [isDirty, onClose, onSave, saveBlockedReason, setUiField, state, validation.errors]);

  return {
    validation,
    isDirty,
    handleSave,
    requestClose,
    showDiscardChangesPrompt,
    confirmDiscardChanges,
    cancelDiscardChanges,
    showValidationSummary: showValidationSummary && validation.errors.length > 0,
  };
};
