import { memo } from 'react';
import type { RefObject } from 'react';
import { cn } from '@/shared/ui/cn';
import { t } from '@/shared/utils/i18n';
import type { ChatInputEmojiGroup } from '@client/features/chat/presentation/input/chatInputEmoji';

type ChatInputEmojiPickerProps = {
  isOpen: boolean;
  pickerRef: RefObject<HTMLDivElement | null>;
  emojiGroups: readonly ChatInputEmojiGroup[];
  onSelectEmoji: (emoji: string) => void;
  onClearRecent: () => void;
};

type ChatInputEmojiGroupSectionProps = {
  group: ChatInputEmojiGroup;
  onSelectEmoji: (emoji: string) => void;
  onClearRecent: () => void;
};

const EMOJI_PICKER_CLASS =
  'absolute bottom-[calc(100%+0.875rem)] left-0 z-30 w-[20rem] max-w-[min(20rem,calc(100vw-3rem))] overflow-hidden border border-[var(--line-1)] bg-[var(--bg-1)] shadow-[0_18px_56px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-[var(--motion-base)] ease-[var(--motion-ease-soft)]';

const ChatInputEmojiGroupSection = memo(function ChatInputEmojiGroupSection({
  group,
  onSelectEmoji,
  onClearRecent,
}: ChatInputEmojiGroupSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--ink-3)]">
        <span>{t(group.labelKey)}</span>
        {group.key === 'recent' ? (
          <button
            type="button"
            onClick={onClearRecent}
            className="px-1 py-0.5 text-[10px] tracking-[0.04em] text-[var(--ink-3)] transition-[background-color,color] duration-[var(--motion-fast)] ease-[var(--motion-ease-standard)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-1)] focus-visible:outline-none"
          >
            {t('input.emoji.clearRecent')}
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {group.emojis.map((emoji, index) => (
          <button
            key={`${group.key}-${index}-${emoji}`}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="inline-flex h-10 w-10 items-center justify-center bg-transparent text-[22px] leading-none transform-gpu transition-[background-color,transform] duration-[var(--motion-base)] ease-[var(--motion-ease-standard)] motion-safe:hover:scale-[1.04] focus-visible:outline-none hover:bg-[var(--bg-2)]"
            aria-label={emoji}
            title={emoji}
          >
            <span aria-hidden="true">{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

export const ChatInputEmojiPicker = memo(function ChatInputEmojiPicker({
  isOpen,
  pickerRef,
  emojiGroups,
  onSelectEmoji,
  onClearRecent,
}: ChatInputEmojiPickerProps) {
  return (
    <div
      ref={pickerRef}
      aria-hidden={!isOpen}
      className={cn(
        EMOJI_PICKER_CLASS,
        isOpen
          ? 'visible translate-y-0 opacity-100'
          : 'invisible pointer-events-none translate-y-2 opacity-0'
      )}
    >
      <div className="border-b border-[var(--line-1)] px-4 py-3">
        <div className="text-[11px] font-medium tracking-[0.04em] text-[var(--ink-2)]">
          {t('input.emoji.open')}
        </div>
      </div>
      <div className="max-h-[22rem] space-y-4 overflow-y-auto px-3 py-3 scrollbar-hide">
        {emojiGroups.map((group) => (
          <ChatInputEmojiGroupSection
            key={group.key}
            group={group}
            onSelectEmoji={onSelectEmoji}
            onClearRecent={onClearRecent}
          />
        ))}
      </div>
    </div>
  );
});
