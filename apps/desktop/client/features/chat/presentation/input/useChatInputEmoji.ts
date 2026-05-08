import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { resolveVisibleChatInputEmojiGroups } from '@client/features/chat/presentation/input/chatInputEmoji';
import {
  clearRecentEmojis,
  pushRecentEmoji,
  readRecentEmojis,
} from '@client/features/chat/presentation/input/chatInputHelpers';

type UseChatInputEmojiOptions = {
  disabled: boolean;
  currentInputRef: RefObject<string>;
  applyInputValue: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  emojiPickerRef: RefObject<HTMLDivElement | null>;
  emojiButtonRef: RefObject<HTMLButtonElement | null>;
};

export const useChatInputEmoji = ({
  disabled,
  currentInputRef,
  applyInputValue,
  textareaRef,
  emojiPickerRef,
  emojiButtonRef,
}: UseChatInputEmojiOptions) => {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => readRecentEmojis());

  useEffect(() => {
    if (!isEmojiPickerOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (emojiPickerRef.current?.contains(target) || emojiButtonRef.current?.contains(target)) {
        return;
      }

      setIsEmojiPickerOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [emojiButtonRef, emojiPickerRef, isEmojiPickerOpen]);

  const handleToggleEmojiPicker = useCallback(() => {
    if (disabled) {
      return;
    }

    setIsEmojiPickerOpen((prev) => !prev);
  }, [disabled]);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      const textarea = textareaRef.current;
      const input = currentInputRef.current;
      const selectionStart = textarea?.selectionStart ?? input.length;
      const selectionEnd = textarea?.selectionEnd ?? input.length;
      const nextValue = `${input.slice(0, selectionStart)}${emoji}${input.slice(selectionEnd)}`;
      const nextCursorPosition = selectionStart + emoji.length;

      applyInputValue(nextValue);
      setRecentEmojis(pushRecentEmoji(emoji));
      textarea?.focus();
      window.requestAnimationFrame(() => {
        textarea?.setSelectionRange(nextCursorPosition, nextCursorPosition);
      });
    },
    [applyInputValue, currentInputRef, textareaRef]
  );

  const handleClearRecentEmojis = useCallback(() => {
    clearRecentEmojis();
    setRecentEmojis([]);
  }, []);

  const visibleEmojiGroups = useMemo(
    () => resolveVisibleChatInputEmojiGroups(recentEmojis),
    [recentEmojis]
  );

  return {
    isEmojiPickerVisible: isEmojiPickerOpen,
    handleToggleEmojiPicker,
    handleEmojiClick,
    handleClearRecentEmojis,
    visibleEmojiGroups,
  };
};

