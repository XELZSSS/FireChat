import { useCallback } from 'react';
import {
  getGlmBaseUrlForEndpoint,
  getMoonshotBaseUrlForEndpoint,
  resolveBaseUrlForRegion,
  resolveGlmEndpointSelection,
  resolveMoonshotEndpointSelection,
  type GlmEndpointMode,
  type MoonshotEndpointMode,
} from '@/infrastructure/providers/config/baseUrl';
import { ProviderJsonButton } from '@client/features/settings/presentation/settingsModal/sections/ProviderJsonButton';
import { ProviderSettingsFields } from '@client/features/settings/presentation/settingsModal/sections/ProviderSettingsFields';
import type { ProviderTabProps } from '@client/features/settings/presentation/settingsModal/sections/providerTab.types';
import { GlmEndpointSelector } from '@client/features/settings/presentation/settingsModal/providerTabSections/GlmEndpointSelector';
import { KimiEndpointSelector } from '@client/features/settings/presentation/settingsModal/providerTabSections/KimiEndpointSelector';
import { OpenAdapterToolsSection } from '@client/features/settings/presentation/settingsModal/providerTabSections/OpenAdapterToolsSection';
import { OpenCodeEndpointSelector } from '@client/features/settings/presentation/settingsModal/providerTabSections/OpenCodeEndpointSelector';
import { RegionSelector } from '@client/features/settings/presentation/settingsModal/providerTabSections/RegionSelector';
import { useProviderJsonApply } from '@client/features/settings/presentation/settingsModal/services/useProviderJsonApply';

const ProviderTab = ({
  providerId,
  currentChatProviderId,
  defaultProviderId,
  providerOptions,
  modelName,
  systemPrompt,
  apiKey,
  requestMode,
  baseUrl,
  customHeaders,
  openAdapterTools,
  providerConfigJsonText,
  showApiKey,
  supportsRequestMode,
  supportsBaseUrl,
  supportsCustomHeaders,
  supportsRegion,
  availableModels,
  isFetchingModels,
  modelFetchError,
  mutationsLockedReason,
  validationIssuesByField,
  onProviderChange,
  onSetDefaultProvider,
  onModelNameChange,
  onSystemPromptChange,
  onImageModelNameChange,
  onImageGenerationChange,
  onFetchModels,
  onApiKeyChange,
  onRequestModeChange,
  onToggleApiKeyVisibility,
  onClearApiKey,
  onBaseUrlChange,
  onProviderConfigJsonTextChange,
  onAddCustomHeader,
  onSetCustomHeaderKey,
  onSetCustomHeaderValue,
  onRemoveCustomHeader,
  onSetRegionBaseUrl,
  onSetOpenAdapterToolEnabled,
}: ProviderTabProps) => {
  const isOpenAdapterProvider = providerId === 'openadapter';
  const isOpenCodeProvider = providerId === 'opencode';
  const isGlmProvider = providerId === 'glm';
  const isKimiProvider = providerId === 'moonshot';
  const glmEndpointSelection = isGlmProvider ? resolveGlmEndpointSelection(baseUrl) : undefined;
  const kimiEndpointSelection = isKimiProvider
    ? resolveMoonshotEndpointSelection(baseUrl)
    : undefined;
  const intlRegionBaseUrl = resolveBaseUrlForRegion(providerId, 'intl');
  const cnRegionBaseUrl = resolveBaseUrlForRegion(providerId, 'cn');
  const isIntlRegion = isGlmProvider
    ? glmEndpointSelection?.region === 'intl'
    : isKimiProvider
      ? kimiEndpointSelection?.region === 'intl'
      : baseUrl === intlRegionBaseUrl;
  const isCnRegion = isGlmProvider
    ? glmEndpointSelection?.region === 'cn'
    : isKimiProvider
      ? kimiEndpointSelection?.region === 'cn'
      : baseUrl === cnRegionBaseUrl;
  const activeGlmEndpointMode = glmEndpointSelection?.mode;
  const activeGlmRegion = glmEndpointSelection?.region;
  const activeKimiEndpointMode = kimiEndpointSelection?.mode;
  const activeKimiRegion = kimiEndpointSelection?.region;
  const handleRegionIntl = useCallback(() => {
    if (isGlmProvider) {
      onBaseUrlChange(getGlmBaseUrlForEndpoint('intl', activeGlmEndpointMode ?? 'api'));
      return;
    }

    if (isKimiProvider) {
      onBaseUrlChange(getMoonshotBaseUrlForEndpoint('intl', activeKimiEndpointMode ?? 'api'));
      return;
    }

    onSetRegionBaseUrl('intl');
  }, [
    activeGlmEndpointMode,
    activeKimiEndpointMode,
    isGlmProvider,
    isKimiProvider,
    onBaseUrlChange,
    onSetRegionBaseUrl,
  ]);
  const handleRegionCn = useCallback(() => {
    if (isGlmProvider) {
      onBaseUrlChange(getGlmBaseUrlForEndpoint('cn', activeGlmEndpointMode ?? 'api'));
      return;
    }

    if (isKimiProvider) {
      onBaseUrlChange(getMoonshotBaseUrlForEndpoint('cn', activeKimiEndpointMode ?? 'api'));
      return;
    }

    onSetRegionBaseUrl('cn');
  }, [
    activeGlmEndpointMode,
    activeKimiEndpointMode,
    isGlmProvider,
    isKimiProvider,
    onBaseUrlChange,
    onSetRegionBaseUrl,
  ]);
  const handleGlmEndpointModeChange = useCallback(
    (mode: GlmEndpointMode) => {
      onBaseUrlChange(getGlmBaseUrlForEndpoint(activeGlmRegion ?? 'intl', mode));
    },
    [activeGlmRegion, onBaseUrlChange]
  );
  const handleKimiEndpointModeChange = useCallback(
    (mode: MoonshotEndpointMode) => {
      onBaseUrlChange(getMoonshotBaseUrlForEndpoint(activeKimiRegion ?? 'intl', mode));
    },
    [activeKimiRegion, onBaseUrlChange]
  );
  const handleApplyProviderJson = useProviderJsonApply({
    providerId,
    currentHeaders: customHeaders,
    actions: {
      onModelNameChange,
      onSystemPromptChange,
      onImageModelNameChange,
      onImageGenerationChange,
      onApiKeyChange,
      onRequestModeChange,
      onBaseUrlChange,
      onAddCustomHeader,
      onSetCustomHeaderKey,
      onSetCustomHeaderValue,
      onRemoveCustomHeader,
      onProviderConfigJsonTextChange,
    },
  });

  return (
    <div className="space-y-4">
      <ProviderSettingsFields
        providerId={providerId}
        currentChatProviderId={currentChatProviderId}
        defaultProviderId={defaultProviderId}
        providerOptions={providerOptions}
        providerConfigJsonText={providerConfigJsonText}
        providerActions={
          <ProviderJsonButton
            initialText={providerConfigJsonText}
            onApply={handleApplyProviderJson}
            disabled={!!mutationsLockedReason}
          />
        }
        modelName={modelName}
        systemPrompt={systemPrompt}
        apiKey={apiKey}
        requestMode={requestMode}
        baseUrl={baseUrl}
        customHeaders={customHeaders}
        showApiKey={showApiKey}
        supportsRequestMode={supportsRequestMode}
        supportsBaseUrl={supportsBaseUrl}
        supportsCustomHeaders={supportsCustomHeaders}
        availableModels={availableModels}
        isFetchingModels={isFetchingModels}
        modelFetchError={modelFetchError}
        mutationsLockedReason={mutationsLockedReason}
        validationIssuesByField={validationIssuesByField}
        onProviderChange={onProviderChange}
        onSetDefaultProvider={onSetDefaultProvider}
        onModelNameChange={onModelNameChange}
        onSystemPromptChange={onSystemPromptChange}
        onFetchModels={onFetchModels}
        onApiKeyChange={onApiKeyChange}
        onRequestModeChange={onRequestModeChange}
        onToggleApiKeyVisibility={onToggleApiKeyVisibility}
        onClearApiKey={onClearApiKey}
        onBaseUrlChange={onBaseUrlChange}
        onAddCustomHeader={onAddCustomHeader}
        onSetCustomHeaderKey={onSetCustomHeaderKey}
        onSetCustomHeaderValue={onSetCustomHeaderValue}
        onRemoveCustomHeader={onRemoveCustomHeader}
      >
        {supportsRegion ? (
          <div
            className={
              isGlmProvider || isKimiProvider ? 'flex flex-wrap items-end gap-3' : undefined
            }
          >
            <RegionSelector
              isCnRegion={isCnRegion}
              isIntlRegion={isIntlRegion}
              onSetRegionCn={handleRegionCn}
              onSetRegionIntl={handleRegionIntl}
            />
            {isGlmProvider ? (
              <GlmEndpointSelector
                activeMode={activeGlmEndpointMode}
                onModeChange={handleGlmEndpointModeChange}
              />
            ) : null}
            {isKimiProvider ? (
              <KimiEndpointSelector
                activeMode={activeKimiEndpointMode}
                onModeChange={handleKimiEndpointModeChange}
              />
            ) : null}
          </div>
        ) : null}

        {isOpenCodeProvider ? (
          <OpenCodeEndpointSelector baseUrl={baseUrl} onBaseUrlChange={onBaseUrlChange} />
        ) : null}

        {isOpenAdapterProvider ? (
          <OpenAdapterToolsSection
            openAdapterTools={openAdapterTools}
            mutationsLockedReason={mutationsLockedReason}
            onSetOpenAdapterToolEnabled={onSetOpenAdapterToolEnabled}
          />
        ) : null}
      </ProviderSettingsFields>
    </div>
  );
};

export default ProviderTab;

