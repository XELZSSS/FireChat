import { memo } from 'react';
import type { ChatAttachment } from '@/shared/types/chat';
import { DescriptionOutlinedIcon, ImagePlusIcon } from '@/shared/ui/icons';
import { t } from '@/shared/utils/i18n';
import { formatAttachmentSize } from '@/shared/utils/chatAttachments';
import { ATTACHMENT_CARD_CLASS } from '@client/features/chat/presentation/chatBubbleParts/constants';

export const MessageAttachmentsSection = memo(function MessageAttachmentsSection({
  attachments,
}: {
  attachments: ChatAttachment[];
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2.5">
      {attachments.map((attachment) => (
        <div key={attachment.id} className={ATTACHMENT_CARD_CLASS}>
          {attachment.kind === 'image' && attachment.data ? (
            <img
              src={`data:${attachment.mimeType};base64,${attachment.data}`}
              alt=""
              className="h-12 w-12 shrink-0 object-cover"
            />
          ) : attachment.kind === 'image' ? (
            <ImagePlusIcon
              size={15}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-[var(--ink-3)]"
            />
          ) : (
            <DescriptionOutlinedIcon
              size={15}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-[var(--ink-3)]"
            />
          )}
          <div className="min-w-0">
            <div className="truncate text-[12px] font-medium tracking-[0.01em] text-[var(--ink-2)]">
              {attachment.name}
            </div>
            <div className="mt-0.5 text-[10px] tracking-[0.02em] text-[var(--ink-3)]">
              {formatAttachmentSize(attachment.size)}
              {attachment.truncated ? ` · ${t('chat.attachments.truncated')}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
