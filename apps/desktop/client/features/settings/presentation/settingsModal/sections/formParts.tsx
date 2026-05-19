import type { ReactNode } from 'react';
import { Toggle } from '@/shared/ui';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';
import {
  settingsCardClass,
  settingsHintClass,
  settingsSectionLabelClass,
  settingsSubLabelClass,
  settingsToggleRowClass,
} from '@client/features/settings/presentation/settingsModal/sections/styles';

type WithChildrenProps = {
  children: ReactNode;
};

const INPUT_VALIDATION_CLASS_BY_SEVERITY = {
  error: 'ring-[var(--status-error)] focus:ring-[var(--status-error)]',
  warning: 'ring-[var(--status-warning-border)] focus:ring-[var(--status-warning-border)]',
} as const;

const FIELD_MESSAGE_CLASS_BY_SEVERITY = {
  error: 'text-[11px] leading-5 text-[var(--status-error)]',
  warning: 'text-[11px] leading-5 text-[var(--status-warning)]',
} as const;

const getHighestSeverity = (issues?: SettingsValidationIssue[]) => {
  if (issues?.some((issue) => issue.severity === 'error')) {
    return 'error' as const;
  }

  if (issues?.some((issue) => issue.severity === 'warning')) {
    return 'warning' as const;
  }

  return undefined;
};

type SettingsCardProps = {
  children: ReactNode;
  className?: string;
};

type SettingsControlGroupProps = {
  label: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
};

type SettingsToggleRowProps = {
  checked: boolean;
  title?: string;
  description?: string;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export const SettingsCard = ({ children, className }: SettingsCardProps) => (
  <div className={`${settingsCardClass}${className ? ` ${className}` : ''}`}>{children}</div>
);

export const SettingsControlGroup = ({
  label,
  children,
  className,
  labelClassName = settingsSubLabelClass,
}: SettingsControlGroupProps) => (
  <div className={className ?? 'space-y-2'}>
    <label className={labelClassName}>{label}</label>
    {children}
  </div>
);

export const SettingsSectionHeading = ({ children }: WithChildrenProps) => (
  <div className={settingsSectionLabelClass}>{children}</div>
);

export const SettingsHint = ({ children }: WithChildrenProps) => (
  <div className={settingsHintClass}>{children}</div>
);

export const getSettingsInputValidationClass = (
  issues?: SettingsValidationIssue[]
): string | undefined => {
  const severity = getHighestSeverity(issues);
  return severity ? INPUT_VALIDATION_CLASS_BY_SEVERITY[severity] : undefined;
};

export const hasSettingsValidationError = (issues?: SettingsValidationIssue[]): boolean =>
  issues?.some((issue) => issue.severity === 'error') ?? false;

export const composeSettingsInputClassName = (
  baseClassName: string,
  issues?: SettingsValidationIssue[]
): string => [baseClassName, getSettingsInputValidationClass(issues)].filter(Boolean).join(' ');

export const SettingsFieldMessages = ({ issues }: { issues?: SettingsValidationIssue[] }) => {
  if (!issues || issues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {issues.map((issue) => (
        <div
          key={`${issue.severity}-${issue.field ?? issue.tab}-${issue.message}`}
          className={FIELD_MESSAGE_CLASS_BY_SEVERITY[issue.severity]}
        >
          {issue.message}
        </div>
      ))}
    </div>
  );
};

export const SettingsToggleRow = ({
  checked,
  title,
  description,
  disabled,
  onCheckedChange,
}: SettingsToggleRowProps) => (
  <label className={settingsToggleRowClass}>
    <Toggle checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    {description ? (
      <span className="space-y-1">
        <span className="block text-xs font-medium text-[var(--ink-2)]">{title}</span>
        <span className={`block ${settingsHintClass}`}>{description}</span>
      </span>
    ) : title ? (
      title
    ) : null}
  </label>
);
