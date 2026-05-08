import { memo } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';

export type FieldProps = {
  label: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
};

const FIELD_LABEL_CLASS = 'text-[11px] font-medium tracking-[0.02em] text-[var(--ink-3)]';
const FIELD_WRAPPER_CLASS = 'space-y-1.5';
const FIELD_HEADER_CLASS = 'flex items-center justify-between gap-2';

const hasFieldLabel = (label: ReactNode): boolean =>
  label !== null && label !== undefined && label !== '';

const FieldLabelContent = ({ id, label }: { id?: string; label: ReactNode }) => {
  const LabelTag = id ? 'label' : 'div';

  return (
    <LabelTag {...(id ? { htmlFor: id } : {})} className={FIELD_LABEL_CLASS}>
      {label}
    </LabelTag>
  );
};

const FieldHeader = ({
  hasLabel,
  id,
  label,
  actions,
}: {
  hasLabel: boolean;
  id?: string;
  label: ReactNode;
  actions?: ReactNode;
}) => (
  <div className={FIELD_HEADER_CLASS}>
    {hasLabel ? <FieldLabelContent id={id} label={label} /> : null}
    {actions ? <div className={hasLabel ? undefined : 'ml-auto'}>{actions}</div> : null}
  </div>
);

const FieldBase = ({ label, actions, children, className, id }: FieldProps) => {
  const hasLabel = hasFieldLabel(label);
  const hasHeader = hasLabel || Boolean(actions);

  return (
    <div className={cn(FIELD_WRAPPER_CLASS, className)}>
      {hasHeader ? (
        <FieldHeader hasLabel={hasLabel} id={id} label={label} actions={actions} />
      ) : null}
      {children}
    </div>
  );
};

const Field = memo(FieldBase);
export default Field;
