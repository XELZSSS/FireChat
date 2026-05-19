import { t } from '@/shared/utils/i18n';
import {
  fullInputClass,
  textareaClass,
} from '@client/features/settings/presentation/settingsModal/sections/styles';
import { Button, Dropdown, Input } from '@/shared/ui';
import { SettingsControlGroup } from '@client/features/settings/presentation/settingsModal/sections/formParts';
import {
  useInputValueHandler,
  useSelectValueHandler,
} from '@client/features/settings/presentation/settingsModal/actions/settingsInputHandlers';
import type { ProviderTransport } from '@contracts/provider-config';

type CustomProviderCreateFormProps = {
  customProviderId: string;
  customProviderLabel: string;
  customProviderTransport: ProviderTransport;
  customProviderBaseUrl: string;
  customProviderApiKey: string;
  customProviderSystemPrompt: string;
  customProviderError: string | null;
  mutationsLockedReason?: string | null;
  onCustomProviderIdChange: (value: string) => void;
  onCustomProviderLabelChange: (value: string) => void;
  onCustomProviderTransportChange: (value: ProviderTransport) => void;
  onCustomProviderBaseUrlChange: (value: string) => void;
  onCustomProviderApiKeyChange: (value: string) => void;
  onCustomProviderSystemPromptChange: (value: string) => void;
  onCreate: () => Promise<void>;
};

export const CustomProviderCreateForm = ({
  customProviderId,
  customProviderLabel,
  customProviderTransport,
  customProviderBaseUrl,
  customProviderApiKey,
  customProviderSystemPrompt,
  customProviderError,
  mutationsLockedReason,
  onCustomProviderIdChange,
  onCustomProviderLabelChange,
  onCustomProviderTransportChange,
  onCustomProviderBaseUrlChange,
  onCustomProviderApiKeyChange,
  onCustomProviderSystemPromptChange,
  onCreate,
}: CustomProviderCreateFormProps) => {
  const transportOptions = [
    {
      value: 'openai-compatible',
      label: t('settings.modal.customProvider.transport.openaiCompatible'),
    },
    { value: 'openai', label: t('settings.modal.customProvider.transport.openai') },
  ];
  const handleCustomProviderIdChange = useInputValueHandler(onCustomProviderIdChange);
  const handleCustomProviderLabelChange = useInputValueHandler(onCustomProviderLabelChange);
  const handleCustomProviderTransportChange = useSelectValueHandler<ProviderTransport>(
    onCustomProviderTransportChange
  );
  const handleCustomProviderBaseUrlChange = useInputValueHandler(onCustomProviderBaseUrlChange);
  const handleCustomProviderApiKeyChange = useInputValueHandler(onCustomProviderApiKeyChange);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-2">
        <SettingsControlGroup label={t('settings.modal.customProvider.id')}>
          <Input
            type="text"
            value={customProviderId}
            onChange={handleCustomProviderIdChange}
            className={fullInputClass}
            compact
            autoComplete="off"
          />
        </SettingsControlGroup>
        <SettingsControlGroup label={t('settings.modal.customProvider.label')}>
          <Input
            type="text"
            value={customProviderLabel}
            onChange={handleCustomProviderLabelChange}
            className={fullInputClass}
            compact
            autoComplete="off"
          />
        </SettingsControlGroup>
        <SettingsControlGroup label={t('settings.modal.customProvider.transport')}>
          <Dropdown
            value={customProviderTransport}
            options={transportOptions}
            onChange={handleCustomProviderTransportChange}
          />
        </SettingsControlGroup>
        <SettingsControlGroup label={t('settings.modal.baseUrl')}>
          <Input
            type="text"
            value={customProviderBaseUrl}
            onChange={handleCustomProviderBaseUrlChange}
            className={fullInputClass}
            compact
            autoComplete="off"
            placeholder={t('settings.modal.baseUrl.placeholder')}
          />
        </SettingsControlGroup>
        <SettingsControlGroup label={t('settings.modal.apiKey')}>
          <Input
            type="password"
            value={customProviderApiKey}
            onChange={handleCustomProviderApiKeyChange}
            className={fullInputClass}
            compact
            autoComplete="off"
          />
        </SettingsControlGroup>
        <div className="col-span-2">
          <SettingsControlGroup label={t('settings.modal.systemPrompt')}>
            <textarea
              value={customProviderSystemPrompt}
              onChange={(event) => onCustomProviderSystemPromptChange(event.target.value)}
              className={`${textareaClass} h-24`}
            />
          </SettingsControlGroup>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => void onCreate()}
          variant="subtle"
          size="sm"
          disabled={Boolean(mutationsLockedReason)}
        >
          {t('settings.modal.customProvider.create')}
        </Button>
      </div>
      {customProviderError ? (
        <div className="text-xs text-[var(--status-error)]">{customProviderError}</div>
      ) : null}
    </div>
  );
};
