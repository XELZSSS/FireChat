import { memo } from 'react';
import Button from '@/shared/ui/composed/button';
import Modal from '@/shared/ui/composed/modal';
import { cn } from '@/shared/ui/cn';
import { WarningAmberOutlinedIcon } from '@/shared/ui/icons';

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  showOverlay?: boolean;
  className?: string;
  overlayClassName?: string;
};

const DIALOG_CLASS = 'z-[81] max-w-md bg-[var(--bg-1)] shadow-none';
const DANGER_ICON_CLASS =
  'inline-flex h-7 w-7 items-center justify-center border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--text-on-brand)]';
const DIALOG_BODY_CLASS = 'px-5 py-4';
const DIALOG_ACTIONS_CLASS = 'mt-4 flex items-center justify-end gap-2';

const resolveConfirmVariant = (danger: boolean) => (danger ? 'danger' : 'primary');

type ConfirmDialogHeaderProps = {
  title: string;
  description?: string;
  danger: boolean;
};

const ConfirmDialogHeader = memo(function ConfirmDialogHeader({
  title,
  description,
  danger,
}: ConfirmDialogHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {danger ? (
          <span className={DANGER_ICON_CLASS}>
            <WarningAmberOutlinedIcon size={16} strokeWidth={2} />
          </span>
        ) : null}
        <h3 className="text-sm font-semibold text-[var(--ink-1)]">{title}</h3>
      </div>
      {description ? <p className="text-xs text-[var(--ink-2)]">{description}</p> : null}
    </div>
  );
});

const ConfirmDialogActions = memo(function ConfirmDialogActions({
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={DIALOG_ACTIONS_CLASS}>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant={resolveConfirmVariant(danger)} size="sm" onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  );
});

const ConfirmDialogComponent = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = false,
  showOverlay = true,
  className,
  overlayClassName,
}: ConfirmDialogProps) => {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      className={cn(DIALOG_CLASS, className)}
      overlayClassName={overlayClassName}
      showOverlay={showOverlay}
      onClose={onCancel}
    >
      <div className={DIALOG_BODY_CLASS}>
        <ConfirmDialogHeader title={title} description={description} danger={danger} />
        <ConfirmDialogActions
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          danger={danger}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </div>
    </Modal>
  );
};

const ConfirmDialog = memo(ConfirmDialogComponent);
export default ConfirmDialog;
