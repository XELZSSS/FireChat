import type { ReactNode } from 'react';
import { t } from '@/shared/utils/i18n';
import { Field } from '@/shared/ui';
import {
  BaseUrlField,
  ProviderConnectionSection,
} from '@client/features/settings/presentation/settingsModal/sections/ProviderConnectionSection';
import { isImageOnlyProviderPlatform } from '@client/features/settings/presentation/settingsModal/sections/providerCatalog';
import { textareaClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import { DefaultProviderCard } from '@client/features/settings/presentation/settingsModal/providerTabSections/DefaultProviderCard';
import {
  ModelField,
  ProviderSelector,
} from '@client/features/settings/presentation/settingsModal/providerTabSections/ModelSelector';
import type { ProviderTabProps } from '@client/features/settings/presentation/settingsModal/sections/providerTab.types';

type ProviderSettingsFieldsProps = Pick<
  ProviderTabProps,
  | 'providerId'
  | 'currentChatProviderId'
  | 'defaultProviderId'
  | 'providerOptions'
  | 'providerConfigJsonText'
  | 'modelName'
  | 'systemPrompt'
  | 'apiKey'
  | 'requestMode'
  | 'baseUrl'
  | 'customHeaders'
  | 'showApiKey'
  | 'supportsRequestMode'
  | 'supportsBaseUrl'
  | 'supportsCustomHeaders'
  | 'availableModels'
  | 'isFetchingModels'
  | 'modelFetchError'
  | 'mutationsLockedReason'
  | 'validationIssuesByField'
  | 'onProviderChange'
  | 'onSetDefaultProvider'
  | 'onModelNameChange'
  | 'onSystemPromptChange'
  | 'onFetchModels'
  | 'onApiKeyChange'
  | 'onRequestModeChange'
  | 'onToggleApiKeyVisibility'
  | 'onClearApiKey'
  | 'onBaseUrlChange'
  | 'onAddCustomHeader'
  | 'onSetCustomHeaderKey'
  | 'onSetCustomHeaderValue'
  | 'onRemoveCustomHeader'
> & {
  providerLabel?: string;
  providerActions?: ReactNode;
  children?: ReactNode;
};

export const ProviderSettingsFields = ({
  providerId,
  currentChatProviderId,
  defaultProviderId,
  providerOptions,
  providerLabel,
  providerActions,
  modelName,
  systemPrompt,
  apiKey,
  requestMode,
  baseUrl,
  customHeaders,
  showApiKey,
  supportsRequestMode,
  supportsBaseUrl,
  supportsCustomHeaders,
  availableModels,
  isFetchingModels,
  modelFetchError,
  mutationsLockedReason,
  validationIssuesByField,
  onProviderChange,
  onSetDefaultProvider,
  onModelNameChange,
  onSystemPromptChange,
  onFetchModels,
  onApiKeyChange,
  onRequestModeChange,
  onToggleApiKeyVisibility,
  onClearApiKey,
  onBaseUrlChange,
  onAddCustomHeader,
  onSetCustomHeaderKey,
  onSetCustomHeaderValue,
  onRemoveCustomHeader,
  children,
}: ProviderSettingsFieldsProps) => {
  const baseUrlIssues = validationIssuesByField['provider.baseUrl'];
  const isImageOnlyProvider = isImageOnlyProviderPlatform(providerId);

  return (
    <>
      <ProviderSelector
        providerId={providerId}
        providerOptions={providerOptions}
        providerLabel={providerLabel}
        providerActions={providerActions}
        onProviderChange={onProviderChange}
      />

      <div className={supportsBaseUrl ? 'grid gap-3 md:grid-cols-2' : undefined}>
        {supportsBaseUrl ? (
          <BaseUrlField
            baseUrl={baseUrl}
            issues={baseUrlIssues}
            onBaseUrlChange={onBaseUrlChange}
          />
        ) : null}

        <ModelField
          modelName={modelName}
          availableModels={availableModels}
          isFetchingModels={isFetchingModels}
          modelFetchError={modelFetchError}
          onModelNameChange={onModelNameChange}
          onFetchModels={onFetchModels}
        />
      </div>

      <Field label={t('settings.modal.systemPrompt')}>
        <textarea
          value={systemPrompt}
          onChange={(event) => onSystemPromptChange(event.target.value)}
          className={`${textareaClass} h-24`}
        />
      </Field>

      {isImageOnlyProvider ? null : (
        <DefaultProviderCard
          providerId={providerId}
          currentChatProviderId={currentChatProviderId}
          defaultProviderId={defaultProviderId}
          providerOptions={providerOptions}
          mutationsLockedReason={mutationsLockedReason}
          onSetDefaultProvider={onSetDefaultProvider}
        />
      )}

      <ProviderConnectionSection
        apiKey={apiKey}
        requestMode={requestMode}
        customHeaders={customHeaders}
        showApiKey={showApiKey}
        supportsRequestMode={supportsRequestMode}
        supportsCustomHeaders={supportsCustomHeaders}
        validationIssuesByField={validationIssuesByField}
        onApiKeyChange={onApiKeyChange}
        onRequestModeChange={onRequestModeChange}
        onToggleApiKeyVisibility={onToggleApiKeyVisibility}
        onClearApiKey={onClearApiKey}
        onAddCustomHeader={onAddCustomHeader}
        onSetCustomHeaderKey={onSetCustomHeaderKey}
        onSetCustomHeaderValue={onSetCustomHeaderValue}
        onRemoveCustomHeader={onRemoveCustomHeader}
      />

      {children}
    </>
  );
};

