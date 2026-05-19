import type { ChangeEvent, ReactNode } from 'react';
import { t } from '@/shared/utils/i18n';
import { Button, Input } from '@/shared/ui';
import { DeleteOutlineIcon, VisibilityIcon, VisibilityOffIcon } from '@/shared/ui/icons';
import {
  composeSettingsInputClassName,
  hasSettingsValidationError,
  SettingsFieldMessages,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';

const ICON_BUTTON_CLASS = 'min-w-0 text-[var(--accent)]';
const ACTIONS_CLASS = 'absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1';
const LABEL_CLASS = 'text-xs font-medium text-[var(--ink-2)]';
const VISIBILITY_BUTTON_CLASS = `${ICON_BUTTON_CLASS} hover:text-[var(--accent-strong)]`;
const CLEAR_BUTTON_CLASS = `${ICON_BUTTON_CLASS} hover:text-[var(--status-error)]`;

const getVisibilityIcon = (showSecret: boolean) =>
  showSecret ? (
    <VisibilityOffIcon size={16} strokeWidth={2} />
  ) : (
    <VisibilityIcon size={16} strokeWidth={2} />
  );

const SecretActionButton = ({
  onClick,
  className,
  ariaLabel,
  title,
  children,
}: {
  onClick: () => void;
  className: string;
  ariaLabel: string;
  title?: string;
  children: ReactNode;
}) => (
  <Button
    onClick={onClick}
    variant="ghost"
    size="icon-xs"
    className={className}
    aria-label={ariaLabel}
    title={title}
  >
    {children}
  </Button>
);

type SecretInputProps = {
  label: string;
  labelClassName?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  showSecret: boolean;
  onToggleVisibility: () => void;
  onClear: () => void;
  visibilityLabel: string;
  clearLabel?: string;
  inputClassName?: string;
  compact?: boolean;
  autoComplete?: string;
  issues?: SettingsValidationIssue[];
  showIssues?: boolean;
};

const SecretInput = ({
  label,
  labelClassName,
  value,
  onChange,
  showSecret,
  onToggleVisibility,
  onClear,
  visibilityLabel,
  clearLabel,
  inputClassName,
  compact,
  autoComplete = 'off',
  issues,
  showIssues = true,
}: SecretInputProps) => {
  const resolvedClearLabel = clearLabel ?? t('settings.apiKey.clear');
  const resolvedInputClassName = composeSettingsInputClassName(inputClassName ?? '', issues);
  const hasError = hasSettingsValidationError(issues);

  return (
    <div className="space-y-2">
      <label className={labelClassName ?? LABEL_CLASS}>{label}</label>
      <div className="relative">
        <Input
          type={showSecret ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={resolvedInputClassName}
          compact={compact}
          autoComplete={autoComplete}
          aria-invalid={hasError || undefined}
        />
        <div className={ACTIONS_CLASS}>
          <SecretActionButton
            onClick={onToggleVisibility}
            className={VISIBILITY_BUTTON_CLASS}
            ariaLabel={visibilityLabel}
          >
            {getVisibilityIcon(showSecret)}
          </SecretActionButton>
          <SecretActionButton
            onClick={onClear}
            className={CLEAR_BUTTON_CLASS}
            ariaLabel={resolvedClearLabel}
            title={resolvedClearLabel}
          >
            <DeleteOutlineIcon size={16} strokeWidth={2} />
          </SecretActionButton>
        </div>
      </div>
      {showIssues ? <SettingsFieldMessages issues={issues} /> : null}
    </div>
  );
};

export default SecretInput;
