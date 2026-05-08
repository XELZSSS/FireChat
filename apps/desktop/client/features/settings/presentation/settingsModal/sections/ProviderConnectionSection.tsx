import { t } from '@/shared/utils/i18n';
import type { OpenAIRequestMode } from '@/infrastructure/providers/types';
import { fullInputClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import { Dropdown, Field, Input } from '@/shared/ui';
import SecretInput from '@client/features/settings/presentation/settingsModal/sections/SecretInput';
import {
  composeSettingsInputClassName,
  hasSettingsValidationError,
  SettingsFieldMessages,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import { useSelectValueHandler } from '@client/features/settings/presentation/settingsModal/actions/settingsInputHandlers';
import { CustomHeadersSection } from '@client/features/settings/presentation/settingsModal/providerTabSections/CustomHeadersSection';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';

type ProviderConnectionSectionProps = {
  apiKey: string;
  requestMode?: OpenAIRequestMode;
  customHeaders: Array<{ key: string; value: string }>;
  showApiKey: boolean;
  supportsRequestMode?: boolean;
  supportsCustomHeaders?: boolean;
  validationIssuesByField: Record<string, SettingsValidationIssue[]>;
  onApiKeyChange: (value: string) => void;
  onRequestModeChange: (value: OpenAIRequestMode) => void;
  onToggleApiKeyVisibility: () => void;
  onClearApiKey: () => void;
  onAddCustomHeader: () => void;
  onSetCustomHeaderKey: (index: number, value: string) => void;
  onSetCustomHeaderValue: (index: number, value: string) => void;
  onRemoveCustomHeader: (index: number) => void;
};

type BaseUrlFieldProps = {
  baseUrl?: string;
  issues?: SettingsValidationIssue[];
  onBaseUrlChange: (value: string) => void;
};

export const BaseUrlField = ({ baseUrl, issues, onBaseUrlChange }: BaseUrlFieldProps) => {
  return (
    <div className="space-y-1.5">
      <Field label={t('settings.modal.baseUrl')}>
        <Input
          type="text"
          value={baseUrl ?? ''}
          onChange={(event) => onBaseUrlChange(event.target.value)}
          className={composeSettingsInputClassName(fullInputClass, issues)}
          compact
          autoComplete="off"
          placeholder={t('settings.modal.baseUrl.placeholder')}
          aria-invalid={hasSettingsValidationError(issues) || undefined}
        />
      </Field>
      <SettingsFieldMessages issues={issues} />
    </div>
  );
};

export const ProviderConnectionSection = ({
  apiKey,
  requestMode,
  customHeaders,
  showApiKey,
  supportsRequestMode,
  supportsCustomHeaders,
  validationIssuesByField,
  onApiKeyChange,
  onRequestModeChange,
  onToggleApiKeyVisibility,
  onClearApiKey,
  onAddCustomHeader,
  onSetCustomHeaderKey,
  onSetCustomHeaderValue,
  onRemoveCustomHeader,
}: ProviderConnectionSectionProps) => {
  const apiKeyVisibilityLabel = showApiKey ? t('settings.apiKey.hide') : t('settings.apiKey.show');
  const handleRequestModeChange = useSelectValueHandler<OpenAIRequestMode>(onRequestModeChange);
  const requestModeOptions = [
    { value: 'chat_completions', label: t('settings.modal.requestMode.chatCompletions') },
    { value: 'responses', label: t('settings.modal.requestMode.responses') },
  ];

  return (
    <>
      {supportsRequestMode ? (
        <Field label={t('settings.modal.requestMode')}>
          <Dropdown
            value={requestMode ?? 'chat_completions'}
            options={requestModeOptions}
            onChange={handleRequestModeChange}
          />
        </Field>
      ) : null}

      <SecretInput
        label={t('settings.modal.apiKey')}
        value={apiKey}
        onChange={(event) => onApiKeyChange(event.target.value)}
        showSecret={showApiKey}
        onToggleVisibility={onToggleApiKeyVisibility}
        onClear={onClearApiKey}
        visibilityLabel={apiKeyVisibilityLabel}
        inputClassName={`${fullInputClass} pr-20`}
      />

      {supportsCustomHeaders ? (
        <div className="space-y-3">
          <CustomHeadersSection
            customHeaders={customHeaders}
            validationIssuesByField={validationIssuesByField}
            onAddCustomHeader={onAddCustomHeader}
            onSetCustomHeaderKey={onSetCustomHeaderKey}
            onSetCustomHeaderValue={onSetCustomHeaderValue}
            onRemoveCustomHeader={onRemoveCustomHeader}
          />
        </div>
      ) : null}
    </>
  );
};

