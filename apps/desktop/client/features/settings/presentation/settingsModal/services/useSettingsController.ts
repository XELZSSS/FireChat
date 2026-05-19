import { useSettingsForm } from '@client/features/settings/presentation/settingsModal/services/useSettingsForm';
import type {
  ProviderSettingsMap,
  SaveSettingsPayload,
} from '@client/features/settings/domain/settingsTypes';
import type { CustomProviderDraft } from '@/infrastructure/providers/runtime/providerFileMutations';
import { useSettingsSectionDispatchers } from '@client/features/settings/presentation/settingsModal/actions/controllerDispatch';
import { useSettingsControllerLifecycle } from '@client/features/settings/presentation/settingsModal/services/useSettingsControllerLifecycle';
import { useSettingsControllerActions } from '@client/features/settings/presentation/settingsModal/services/useSettingsControllerActions';
import { useSettingsProviderFlow } from '@client/features/settings/presentation/settingsModal/services/useSettingsProviderFlow';

type UseSettingsControllerOptions = {
  onClose: () => void;
  onSave: (value: SaveSettingsPayload) => void | Promise<void>;
  onCreateCustomProvider: (draft: CustomProviderDraft) => Promise<string>;
  onDeleteProvider: (providerId: string) => Promise<void>;
  providerSettings: ProviderSettingsMap;
  saveBlockedReason?: string | null;
} & Parameters<typeof useSettingsForm>[0];

export const useSettingsController = ({
  onClose,
  onSave,
  onCreateCustomProvider,
  onDeleteProvider,
  saveBlockedReason = null,
  providerId: currentProviderId,
  ...formOptions
}: UseSettingsControllerOptions) => {
  const { state, stateSeed, dispatch, providerOptions, activeMeta, tabs, handleProviderChange } =
    useSettingsForm({
      providerId: currentProviderId,
      ...formOptions,
    });
  const { setProviderField, setAppField, setUiField } = useSettingsSectionDispatchers(dispatch);
  const {
    validation,
    isDirty,
    handleSave,
    requestClose,
    showDiscardChangesPrompt,
    confirmDiscardChanges,
    cancelDiscardChanges,
    showValidationSummary,
  } = useSettingsControllerLifecycle({
    onClose,
    onSave,
    saveBlockedReason,
    state,
    stateSeed,
    setUiField,
  });
  const {
    onTabChange,
    providerActions,
    appearanceActions,
    versionActions,
    optionsActions,
  } = useSettingsControllerActions({
    dispatch,
    state,
    handleProviderChange,
    setProviderField,
    setAppField,
    setUiField,
  });
  const {
    availableModels,
    isFetchingModels,
    modelFetchError,
    handleFetchModels,
    handleCreateProvider,
    handleDeleteProvider,
    builtInProviderOptions,
    customProviderOptions,
    providerSource,
  } = useSettingsProviderFlow({
    provider: state.provider,
    providerOptions,
    handleProviderChange,
    setUiField,
    onCreateCustomProvider,
    onDeleteProvider,
  });

  return {
    currentConversationProviderId: currentProviderId,
    state,
    tabs,
    providerOptions,
    builtInProviderOptions,
    customProviderOptions,
    availableModels,
    isFetchingModels,
    modelFetchError,
    activeMeta,
    validation,
    isDirty,
    handleSave,
    requestClose,
    showDiscardChangesPrompt,
    confirmDiscardChanges,
    cancelDiscardChanges,
    showValidationSummary,
    onTabChange,
    providerActions,
    appearanceActions,
    versionActions,
    optionsActions,
    handleFetchModels,
    handleCreateProvider,
    handleDeleteProvider,
    providerSource,
  };
};

export type SettingsControllerValue = ReturnType<typeof useSettingsController>;
