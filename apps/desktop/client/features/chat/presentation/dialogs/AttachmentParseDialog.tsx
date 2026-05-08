import { memo } from 'react';
import { t } from '@/shared/utils/i18n';
import { Button, Field, Input, Modal } from '@/shared/ui';
import { formatAttachmentSize } from '@/shared/utils/chatAttachments';
import type { PendingStructuredAttachment } from '@client/features/chat/presentation/input/chatInputAttachmentHelpers';

type AttachmentParseDialogProps = {
  isOpen: boolean;
  attachments: PendingStructuredAttachment[];
  onClose: () => void;
  onConfirm: () => void;
  onChangePageRange: (attachmentId: string, pageRange: string) => void;
};

type AttachmentParseItemProps = {
  attachment: PendingStructuredAttachment;
  onChangePageRange: (attachmentId: string, pageRange: string) => void;
};

const ATTACHMENT_CARD_CLASS =
  'space-y-3 border border-[var(--line-1)] bg-[var(--bg-2)] p-3';

const AttachmentParseItem = memo(function AttachmentParseItem({
  attachment,
  onChangePageRange,
}: AttachmentParseItemProps) {
  return (
    <div className={ATTACHMENT_CARD_CLASS}>
      <div>
        <div className="truncate text-sm font-medium text-[var(--ink-1)]">
          {attachment.file.name}
        </div>
        <div className="text-xs text-[var(--ink-3)]">
          {formatAttachmentSize(attachment.file.size)}
        </div>
      </div>
      {attachment.supportsPageRange ? (
        <Field label={t('input.attach.parseDialog.pageRange')}>
          <Input
            value={attachment.pageRange}
            onChange={(event) => onChangePageRange(attachment.id, event.target.value)}
            placeholder={t('input.attach.parseDialog.pageRangePlaceholder')}
          />
        </Field>
      ) : null}
    </div>
  );
});

const AttachmentParseDialogBase = ({
  isOpen,
  attachments,
  onClose,
  onConfirm,
  onChangePageRange,
}: AttachmentParseDialogProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen
      title={t('input.attach.parseDialog.title')}
      className="max-w-[min(42rem,calc(100vw-2rem))]"
      onClose={onClose}
      ariaDescribedBy={false}
    >
      <div className="space-y-4 px-5 py-4">
        <p className="text-sm leading-6 text-[var(--ink-2)]">
          {t('input.attach.parseDialog.description')}
        </p>

        <div className="space-y-3">
          {attachments.map((attachment) => (
            <AttachmentParseItem
              key={attachment.id}
              attachment={attachment}
              onChangePageRange={onChangePageRange}
            />
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('input.attach.parseDialog.cancel')}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {t('input.attach.parseDialog.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const AttachmentParseDialog = memo(AttachmentParseDialogBase);
export default AttachmentParseDialog;

