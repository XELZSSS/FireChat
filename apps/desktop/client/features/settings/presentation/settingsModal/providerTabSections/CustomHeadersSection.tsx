import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { t } from '@/shared/utils/i18n';
import { fullInputClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import { Button, Input } from '@/shared/ui';
import { DeleteOutlineIcon } from '@/shared/ui/icons';
import {
  composeSettingsInputClassName,
  hasSettingsValidationError,
  SettingsFieldMessages,
  SettingsSectionHeading,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';
import type {
  CustomHeaderRowProps,
  CustomHeadersSectionProps,
} from '@client/features/settings/presentation/settingsModal/sections/providerTab.types';

const CustomHeaderInput = ({
  value,
  placeholder,
  issues,
  onChange,
}: {
  value: string;
  placeholder: string;
  issues?: SettingsValidationIssue[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) => (
  <Input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={composeSettingsInputClassName(fullInputClass, issues)}
    compact
    autoComplete="off"
    aria-invalid={hasSettingsValidationError(issues) || undefined}
  />
);

const CustomHeaderRow = ({
  header,
  index,
  issues,
  onSetCustomHeaderKey,
  onSetCustomHeaderValue,
  onRemoveCustomHeader,
}: CustomHeaderRowProps) => {
  const handleKeyChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onSetCustomHeaderKey(index, event.target.value);
    },
    [index, onSetCustomHeaderKey]
  );
  const handleValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onSetCustomHeaderValue(index, event.target.value);
    },
    [index, onSetCustomHeaderValue]
  );
  const handleRemove = useCallback(() => {
    onRemoveCustomHeader(index);
  }, [index, onRemoveCustomHeader]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CustomHeaderInput
          value={header.key}
          placeholder={t('settings.modal.customHeaders.key')}
          issues={issues}
          onChange={handleKeyChange}
        />
        <CustomHeaderInput
          value={header.value}
          placeholder={t('settings.modal.customHeaders.value')}
          issues={issues}
          onChange={handleValueChange}
        />
        <Button
          onClick={handleRemove}
          variant="ghost"
          size="icon-sm"
          className="hover:text-[var(--status-error)]"
          aria-label={t('settings.modal.customHeaders.remove')}
          title={t('settings.modal.customHeaders.remove')}
        >
          <DeleteOutlineIcon size={16} strokeWidth={2} />
        </Button>
      </div>
      <SettingsFieldMessages issues={issues} />
    </div>
  );
};

export const CustomHeadersSection = ({
  customHeaders,
  validationIssuesByField,
  onAddCustomHeader,
  onSetCustomHeaderKey,
  onSetCustomHeaderValue,
  onRemoveCustomHeader,
}: CustomHeadersSectionProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <SettingsSectionHeading>{t('settings.modal.customHeaders')}</SettingsSectionHeading>
      <Button
        onClick={onAddCustomHeader}
        variant="ghost"
        size="sm"
        className="h-auto bg-transparent px-0 py-0 text-xs hover:bg-transparent"
      >
        {t('settings.modal.customHeaders.add')}
      </Button>
    </div>
    <div className="space-y-1.5">
      {customHeaders.map((header, index) => (
        <CustomHeaderRow
          key={`${header.key}-${index}`}
          header={header}
          index={index}
          issues={validationIssuesByField[`provider.customHeaders.${index}`]}
          onSetCustomHeaderKey={onSetCustomHeaderKey}
          onSetCustomHeaderValue={onSetCustomHeaderValue}
          onRemoveCustomHeader={onRemoveCustomHeader}
        />
      ))}
    </div>
  </div>
);

