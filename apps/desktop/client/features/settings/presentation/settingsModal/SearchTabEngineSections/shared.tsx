import type { ChangeEvent } from 'react';
import { t } from '@/shared/utils/i18n';
import { Dropdown, Input, Toggle } from '@/shared/ui';
import { DEFAULT_MAX_TOOL_CALL_ROUNDS } from '@/infrastructure/providers/utils';
import {
  SettingsControlGroup,
  SettingsFieldMessages,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import { fullInputClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';

export const hasValidationError = (issues?: SettingsValidationIssue[]) =>
  issues?.some((issue) => issue.severity === 'error');

export const sanitizeDigits = (value: string) => value.replace(/[^\d]/g, '');

export const parseOptionalNumber = (value: string) => {
  const normalized = sanitizeDigits(value);
  return normalized ? Number(normalized) : undefined;
};

export const getSearchIssues = (
  validationIssuesByField: Record<string, SettingsValidationIssue[]>,
  field: string
) => validationIssuesByField[field];

export const NumericInput = ({
  value,
  issues,
  className,
  hasError,
  placeholder = String(DEFAULT_MAX_TOOL_CALL_ROUNDS),
  onChange,
  onBlur,
}: {
  value: string | number;
  issues?: SettingsValidationIssue[];
  className?: string;
  hasError?: boolean;
  placeholder?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
}) => (
  <div className="space-y-2">
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={[`${fullInputClass} text-xs`, className].filter(Boolean).join(' ')}
      compact
      autoComplete="off"
      aria-invalid={hasError || undefined}
    />
    <SettingsFieldMessages issues={issues} />
  </div>
);

export const SearchNumericControl = ({
  label,
  value,
  issues,
  onChange,
  onBlur,
}: {
  label: string;
  value: string | number;
  issues?: SettingsValidationIssue[];
  onChange: (value: string) => void;
  onBlur?: () => void;
}) => (
  <SettingsControlGroup label={label}>
    <NumericInput
      value={value}
      issues={issues}
      hasError={hasValidationError(issues)}
      onChange={(event) => onChange(sanitizeDigits(event.target.value))}
      onBlur={onBlur}
    />
  </SettingsControlGroup>
);

export const SearchDropdownControl = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) => (
  <SettingsControlGroup label={label}>
    <Dropdown value={value} options={options} onChange={onChange} widthClassName="w-full" />
  </SettingsControlGroup>
);

export const SearchTextControl = ({
  label,
  value,
  placeholder,
  issues,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  issues?: SettingsValidationIssue[];
  onChange: (value: string) => void;
}) => (
  <SettingsControlGroup label={label}>
    <div className="space-y-2">
      <Input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fullInputClass}
        compact
        autoComplete="off"
        placeholder={placeholder}
        aria-invalid={hasValidationError(issues) || undefined}
      />
      <SettingsFieldMessages issues={issues} />
    </div>
  </SettingsControlGroup>
);

export const SearchToggleControl = ({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <label className="flex items-center gap-2 text-xs text-[var(--ink-3)]">
    <Toggle checked={checked} onCheckedChange={onCheckedChange} />
    {label}
  </label>
);

export const SearchEngineCommonControls = ({
  toolCallMaxRounds,
  maxResults,
  toolCallRoundsIssues,
  maxResultsIssues,
  onToolCallMaxRoundsChange,
  onToolCallMaxRoundsBlur,
  onSetMaxResults,
}: {
  toolCallMaxRounds: string;
  maxResults: number | undefined;
  toolCallRoundsIssues?: SettingsValidationIssue[];
  maxResultsIssues?: SettingsValidationIssue[];
  onToolCallMaxRoundsChange: (value: string) => void;
  onToolCallMaxRoundsBlur?: () => void;
  onSetMaxResults: (value: number | undefined) => void;
}) => (
  <>
    <SearchNumericControl
      label={t('settings.modal.toolCallRounds')}
      value={toolCallMaxRounds}
      issues={toolCallRoundsIssues}
      onChange={onToolCallMaxRoundsChange}
      onBlur={onToolCallMaxRoundsBlur}
    />
    <SearchNumericControl
      label={t('settings.modal.tavily.maxResults')}
      value={maxResults ?? 5}
      issues={maxResultsIssues}
      onChange={(value) => onSetMaxResults(parseOptionalNumber(value))}
    />
  </>
);

