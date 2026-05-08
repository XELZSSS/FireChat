import type { ComponentProps } from 'react';
import ProviderTab from '@client/features/settings/presentation/settingsModal/tabs/ProviderTab';
import CustomProviderTab from '@client/features/settings/presentation/settingsModal/tabs/CustomProviderTab';
import type { SettingsTabContentBuildContext } from '@client/features/settings/presentation/settingsModal/tabs/tabContentBuilderTypes';

type ProviderTabProps = ComponentProps<typeof ProviderTab>;
type CustomProviderTabProps = ComponentProps<typeof CustomProviderTab>;

const buildSharedProviderTabProps = ({
  controller,
  activeMeta,
  interactionLockReason,
}: Pick<SettingsTabContentBuildContext, 'controller' | 'activeMeta' | 'interactionLockReason'>) => {
  const {
    state,
    validation,
    providerActions,
    availableModels,
    availableImageModels,
    isFetchingModels,
    isFetchingImageModels,
    modelFetchError,
    imageModelFetchError,
    handleFetchModels,
    handleFetchImageModels,
  } = controller;
  const { provider, app, ui } = state;

  return {
    providerId: provider.providerId,
    currentChatProviderId: controller.currentConversationProviderId,
    defaultProviderId: app.defaultProviderId,
    modelName: provider.modelName,
    systemPrompt: provider.systemPrompt,
    imageModelName: provider.imageModelName,
    apiKey: provider.apiKey,
    requestMode: provider.requestMode,
    baseUrl: provider.baseUrl,
    customHeaders: provider.customHeaders,
    openAdapterTools: provider.openAdapterTools,
    providerConfigJsonText: ui.providerConfigJsonText,
    showApiKey: ui.showApiKey,
    supportsRequestMode: activeMeta?.supportsRequestMode,
    supportsBaseUrl: activeMeta?.supportsBaseUrl,
    supportsCustomHeaders: activeMeta?.supportsCustomHeaders,
    supportsRegion: activeMeta?.supportsRegion,
    availableModels,
    availableImageModels,
    isFetchingModels,
    isFetchingImageModels,
    modelFetchError,
    imageModelFetchError,
    isOfficialProvider: activeMeta?.isOfficialProvider,
    mutationsLockedReason: interactionLockReason,
    validationIssuesByField: validation.issuesByField,
    onProviderChange: providerActions.onProviderChange,
    onSetDefaultProvider: providerActions.onSetDefaultProvider,
    onModelNameChange: providerActions.onModelNameChange,
    onSystemPromptChange: providerActions.onSystemPromptChange,
    onImageModelNameChange: providerActions.onImageModelNameChange,
    onImageGenerationChange: providerActions.onImageGenerationChange,
    onFetchModels: handleFetchModels,
    onFetchImageModels: handleFetchImageModels,
    onApiKeyChange: providerActions.onApiKeyChange,
    onRequestModeChange: providerActions.onRequestModeChange,
    onToggleApiKeyVisibility: providerActions.onToggleApiKeyVisibility,
    onClearApiKey: providerActions.onClearApiKey,
    onBaseUrlChange: providerActions.onBaseUrlChange,
    onProviderConfigJsonTextChange: providerActions.onProviderConfigJsonTextChange,
    onAddCustomHeader: providerActions.onAddCustomHeader,
    onSetCustomHeaderKey: providerActions.onSetCustomHeaderKey,
    onSetCustomHeaderValue: providerActions.onSetCustomHeaderValue,
    onRemoveCustomHeader: providerActions.onRemoveCustomHeader,
    onSetRegionBaseUrl: providerActions.onSetRegionBaseUrl,
    onSetOpenAdapterToolEnabled: providerActions.onSetOpenAdapterToolEnabled,
  };
};

export const buildProviderTabProps = (
  context: Pick<
    SettingsTabContentBuildContext,
    'controller' | 'activeMeta' | 'interactionLockReason'
  >
): ProviderTabProps => ({
  ...buildSharedProviderTabProps(context),
  providerOptions: context.controller.builtInProviderOptions,
});

export const buildCustomProviderTabProps = (
  context: Pick<
    SettingsTabContentBuildContext,
    'controller' | 'activeMeta' | 'interactionLockReason'
  >
): CustomProviderTabProps => ({
  ...buildSharedProviderTabProps(context),
  aiGateway: context.controller.state.app.aiGateway,
  cli: context.controller.state.app.cli,
  providerOptions: context.controller.customProviderOptions,
  providerSource: context.controller.providerSource,
  onAiGatewayChange: context.controller.aiGatewayActions.onAiGatewayChange,
  onCliSettingsChange: context.controller.cliActions.onCliSettingsChange,
  onCreateCustomProvider: context.controller.handleCreateProvider,
  onDeleteProvider: context.controller.handleDeleteProvider,
});

