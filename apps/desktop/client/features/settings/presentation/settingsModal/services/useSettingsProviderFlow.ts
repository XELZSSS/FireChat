import { useCallback } from 'react';
import type { CustomProviderDraft } from '@/infrastructure/providers/runtime/providerFileMutations';
import type { ProviderId } from '@/shared/types/chat';
import type { DropdownOption } from '@/shared/ui';
import {
  getProviderSource,
  partitionProviderOptionsBySource,
} from '@client/features/settings/presentation/settingsModal/sections/providerCatalog';
import type { SettingsModalState } from '@client/features/settings/presentation/settingsModal/state/reducer';
import { useProviderModelCatalog } from '@client/features/settings/presentation/settingsModal/services/useProviderModelCatalog';

type UiFieldSetter = <K extends keyof SettingsModalState['ui']>(
  key: K,
  value: SettingsModalState['ui'][K]
) => void;

type UseSettingsProviderFlowOptions = {
  provider: SettingsModalState['provider'];
  providerOptions: DropdownOption[];
  handleProviderChange: (providerId: ProviderId) => void;
  setUiField: UiFieldSetter;
  onCreateCustomProvider: (draft: CustomProviderDraft) => Promise<string>;
  onDeleteProvider: (providerId: ProviderId) => Promise<void>;
};

export const useSettingsProviderFlow = ({
  provider,
  providerOptions,
  handleProviderChange,
  setUiField,
  onCreateCustomProvider,
  onDeleteProvider,
}: UseSettingsProviderFlowOptions) => {
  const { providerId, modelName, apiKey, baseUrl, customHeaders, requestMode } = provider;
  const { builtIn: builtInProviderOptions, custom: customProviderOptions } =
    partitionProviderOptionsBySource(providerOptions);
  const {
    availableModels,
    isFetchingModels,
    modelFetchError,
    handleFetchModels,
    clearProviderModelFetchError,
  } = useProviderModelCatalog({
    providerId,
    modelName,
    apiKey,
    baseUrl,
    customHeaders,
    requestMode,
  });
  const selectProvider = useCallback(
    (nextProviderId: ProviderId) => {
      handleProviderChange(nextProviderId);
      clearProviderModelFetchError(nextProviderId);
    },
    [clearProviderModelFetchError, handleProviderChange]
  );

  const handleCreateProvider = useCallback(
    async (draft: CustomProviderDraft) => {
      const nextProviderId = await onCreateCustomProvider(draft);
      selectProvider(nextProviderId);
    },
    [onCreateCustomProvider, selectProvider]
  );

  const handleDeleteProvider = useCallback(async () => {
    await onDeleteProvider(providerId);

    const nextCustomProviderId = customProviderOptions.find(
      (option) => option.value !== providerId
    )?.value;
    if (nextCustomProviderId) {
      selectProvider(nextCustomProviderId);
      return;
    }

    const nextBuiltInProviderId = builtInProviderOptions[0]?.value;
    if (nextBuiltInProviderId) {
      selectProvider(nextBuiltInProviderId);
      setUiField('activeTab', 'provider');
    }
  }, [
    builtInProviderOptions,
    customProviderOptions,
    onDeleteProvider,
    providerId,
    selectProvider,
    setUiField,
  ]);

  return {
    availableModels,
    isFetchingModels,
    modelFetchError,
    handleFetchModels,
    handleCreateProvider,
    handleDeleteProvider,
    builtInProviderOptions,
    customProviderOptions,
    providerSource: getProviderSource(providerId),
  };
};
