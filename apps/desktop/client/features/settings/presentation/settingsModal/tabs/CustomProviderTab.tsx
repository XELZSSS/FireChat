import { t } from '@/shared/utils/i18n';
import { Button, Field } from '@/shared/ui';
import { CustomProviderCreateForm } from '@client/features/settings/presentation/settingsModal/sections/CustomProviderCreateForm';
import { ProviderJsonButton } from '@client/features/settings/presentation/settingsModal/sections/ProviderJsonButton';
import { ProviderSettingsFields } from '@client/features/settings/presentation/settingsModal/sections/ProviderSettingsFields';
import type { CustomProviderTabProps } from '@client/features/settings/presentation/settingsModal/sections/providerTab.types';
import { useCustomProviderDraft } from '@client/features/settings/presentation/settingsModal/services/useCustomProviderDraft';
import { buildCustomProviderJsonTemplate } from '@client/features/settings/infrastructure/providerJsonConfig';
import { useProviderJsonApply } from '@client/features/settings/presentation/settingsModal/services/useProviderJsonApply';

const CustomProviderTab = ({
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
  providerConfigJsonText,
  showApiKey,
  supportsRequestMode,
  supportsBaseUrl,
  supportsCustomHeaders,
  availableModels,
  isFetchingModels,
  modelFetchError,
  providerSource = 'builtin',
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
  onCreateCustomProvider,
  onDeleteProvider,
}: CustomProviderTabProps) => {
  const hasCustomProviders = providerOptions.length > 0;
  const {
    isCreatingProvider,
    customProviderId,
    customProviderLabel,
    customProviderTransport,
    customProviderBaseUrl,
    customProviderApiKey,
    customProviderSystemPrompt,
    customProviderError,
    setCustomProviderId,
    setCustomProviderLabel,
    setCustomProviderTransport,
    setCustomProviderBaseUrl,
    setCustomProviderApiKey,
    setCustomProviderSystemPrompt,
    toggleCreateProvider,
    createProvider,
  } = useCustomProviderDraft({
    onCreateCustomProvider,
  });
  const handleApplyProviderJson = useProviderJsonApply({
    providerId,
    currentHeaders: customHeaders,
    allowCreateProvider: !hasCustomProviders,
    onCreateCustomProvider,
    onProviderChange,
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
      <Field
        label={t('settings.modal.customProvider.title')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={toggleCreateProvider}
              variant="subtle"
              size="md"
              className="px-3 text-sm"
              disabled={!!mutationsLockedReason}
            >
              {isCreatingProvider
                ? t('settings.modal.customProvider.cancel')
                : t('settings.modal.customProvider.add')}
            </Button>
            <ProviderJsonButton
              initialText={
                hasCustomProviders ? providerConfigJsonText : buildCustomProviderJsonTemplate()
              }
              onApply={handleApplyProviderJson}
              disabled={!!mutationsLockedReason}
            />
            {hasCustomProviders && providerSource === 'custom' ? (
              <Button
                onClick={() => void onDeleteProvider()}
                variant="ghost"
                size="sm"
                disabled={!!mutationsLockedReason}
                className="text-[var(--status-error)]"
              >
                {t('settings.modal.customProvider.delete')}
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="text-xs leading-5 text-[var(--ink-3)]">
          {hasCustomProviders
            ? t('settings.modal.customProvider.currentHint')
            : t('settings.modal.customProvider.empty')}
        </div>
      </Field>

      {isCreatingProvider ? (
        <CustomProviderCreateForm
          customProviderId={customProviderId}
          customProviderLabel={customProviderLabel}
          customProviderTransport={customProviderTransport}
          customProviderBaseUrl={customProviderBaseUrl}
          customProviderApiKey={customProviderApiKey}
          customProviderSystemPrompt={customProviderSystemPrompt}
          customProviderError={customProviderError}
          mutationsLockedReason={mutationsLockedReason}
          onCustomProviderIdChange={setCustomProviderId}
          onCustomProviderLabelChange={setCustomProviderLabel}
          onCustomProviderTransportChange={setCustomProviderTransport}
          onCustomProviderBaseUrlChange={setCustomProviderBaseUrl}
          onCustomProviderApiKeyChange={setCustomProviderApiKey}
          onCustomProviderSystemPromptChange={setCustomProviderSystemPrompt}
          onCreate={createProvider}
        />
      ) : null}

      {hasCustomProviders ? (
        <ProviderSettingsFields
          providerId={providerId}
          currentChatProviderId={currentChatProviderId}
          defaultProviderId={defaultProviderId}
          providerOptions={providerOptions}
          providerLabel={t('settings.modal.customProvider.title')}
          providerConfigJsonText={providerConfigJsonText}
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
          onProviderConfigJsonTextChange={onProviderConfigJsonTextChange}
          onAddCustomHeader={onAddCustomHeader}
          onSetCustomHeaderKey={onSetCustomHeaderKey}
          onSetCustomHeaderValue={onSetCustomHeaderValue}
          onRemoveCustomHeader={onRemoveCustomHeader}
        />
      ) : null}
    </div>
  );
};

export default CustomProviderTab;
