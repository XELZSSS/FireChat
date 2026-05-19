import { memo, useCallback, type MouseEvent, type ReactNode, type Ref } from 'react';
import type { ChatAttachment } from '@/shared/types/chat';
import { formatAttachmentSize } from '@/shared/utils/chatAttachments';
import { CloseIcon, DescriptionOutlinedIcon, ImagePlusIcon } from '@/shared/ui/icons';
import { ACTION_BUTTON_CLASS } from '@client/features/chat/presentation/input/chatInputHelpers';
import ButtonPrimitive from '@/shared/ui/primitives/button';

type ChatInputActionButtonProps = {
  disabled: boolean;
  label: string;
  toneClassName: string;
  onClick: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
  onMouseDown?: (event: MouseEvent<HTMLButtonElement>) => void;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaHasPopup?: boolean;
  ariaControls?: string;
  children: ReactNode;
};

const getActionButtonClassName = (toneClassName: string, disabled: boolean) =>
  `${ACTION_BUTTON_CLASS} ${toneClassName}${disabled ? ' cursor-not-allowed opacity-50' : ''}`;

const CHAT_INPUT_ACTION_TONE_CLASS = {
  inactive:
    'border border-transparent bg-transparent text-[var(--ink-3)] hover:bg-transparent hover:text-[var(--accent)]',
  active:
    'border border-transparent bg-transparent text-[var(--accent)] hover:text-[var(--accent-strong)]',
} as const;

type ChatInputAttachmentChipProps = {
  attachment: ChatAttachment;
  removeLabel: string;
  truncatedLabel: string;
  onRemove: (attachmentId: string) => void;
};

export const resolveChatInputActionToneClass = (active: boolean): string =>
  active ? CHAT_INPUT_ACTION_TONE_CLASS.active : CHAT_INPUT_ACTION_TONE_CLASS.inactive;

export const ChatInputActionButton = memo(function ChatInputActionButton({
  disabled,
  label,
  toneClassName,
  onClick,
  buttonRef,
  onMouseDown,
  ariaPressed,
  ariaExpanded,
  ariaHasPopup,
  ariaControls,
  children,
}: ChatInputActionButtonProps) {
  return (
    <ButtonPrimitive
      ref={buttonRef}
      onMouseDown={onMouseDown}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup ? 'dialog' : undefined}
      aria-controls={ariaControls}
      aria-label={label}
      title={label}
      className={getActionButtonClassName(toneClassName, disabled)}
    >
      <span aria-hidden="true">{children}</span>
    </ButtonPrimitive>
  );
});

export const ChatInputAttachmentChip = memo(function ChatInputAttachmentChip({
  attachment,
  removeLabel,
  truncatedLabel,
  onRemove,
}: ChatInputAttachmentChipProps) {
  const handleRemove = useCallback(() => {
    onRemove(attachment.id);
  }, [attachment.id, onRemove]);

  return (
    <div className="flex min-w-0 max-w-full items-start gap-2 border border-[var(--line-1)] bg-[var(--bg-1)] px-2.5 py-2">
      {attachment.kind === 'image' && attachment.data ? (
        <img
          src={`data:${attachment.mimeType};base64,${attachment.data}`}
          alt=""
          className="h-9 w-9 shrink-0 object-cover"
        />
      ) : attachment.kind === 'image' ? (
        <ImagePlusIcon size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--ink-3)]" />
      ) : (
        <DescriptionOutlinedIcon
          size={14}
          strokeWidth={2}
          className="mt-0.5 shrink-0 text-[var(--ink-3)]"
        />
      )}
      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium tracking-[0.015em] text-[var(--ink-2)]">
          {attachment.name}
        </div>
        <div className="text-[10px] tracking-[0.02em] text-[var(--ink-3)]">
          {formatAttachmentSize(attachment.size)}
          {attachment.truncated ? ` · ${truncatedLabel}` : ''}
        </div>
      </div>
      <button
        type="button"
        onClick={handleRemove}
        className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-[var(--ink-3)] transition-colors hover:text-[var(--ink-1)] focus-visible:outline-none"
        aria-label={`${removeLabel} ${attachment.name}`}
        title={removeLabel}
      >
        <CloseIcon size={12} strokeWidth={2} />
      </button>
    </div>
  );
});
