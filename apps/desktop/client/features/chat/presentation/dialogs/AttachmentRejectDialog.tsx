import { memo } from 'react';
import { t } from '@/shared/utils/i18n';
import { Button, Modal } from '@/shared/ui';
import { WarningAmberOutlinedIcon } from '@/shared/ui/icons';

type AttachmentRejectDialogProps = {
  isOpen: boolean;
  messages: string[];
  onClose: () => void;
};

const AttachmentRejectDialogBase = ({ isOpen, messages, onClose }: AttachmentRejectDialogProps) => {
  if (!isOpen || messages.length === 0) {
    return null;
  }

  return (
    <Modal
      isOpen
      title={t('input.attach.rejectDialog.title')}
      className="max-w-[min(30rem,calc(100vw-2rem))]"
      onClose={onClose}
      ariaDescribedBy={false}
    >
      <div className="space-y-4 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--text-on-brand)]">
            <WarningAmberOutlinedIcon size={16} strokeWidth={2} />
          </span>
          <h3 className="text-sm font-semibold text-[var(--ink-1)]">
            {t('input.attach.rejectDialog.title')}
          </h3>
        </div>

        <p className="text-sm leading-6 text-[var(--ink-2)]">
          {t('input.attach.rejectDialog.description')}
        </p>

        <ul className="max-h-52 space-y-2 overflow-auto border border-[var(--line-1)] bg-[var(--bg-2)] p-3 text-xs leading-5 text-[var(--ink-2)]">
          {messages.map((message, index) => (
            <li key={`${message}-${index}`}>{message}</li>
          ))}
        </ul>

        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            {t('input.attach.rejectDialog.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const AttachmentRejectDialog = memo(AttachmentRejectDialogBase);
export default AttachmentRejectDialog;
