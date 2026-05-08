import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

type UseChatInputValueOptions = {
  initialInput: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  setCurrentInput: (value: string) => void;
  persistDraft: (value: string) => void;
  syncChatInputLayout: () => void;
  onHasInputChange?: (hasInput: boolean) => void;
};

export const useChatInputValue = ({
  initialInput,
  textareaRef,
  setCurrentInput,
  persistDraft,
  syncChatInputLayout,
  onHasInputChange,
}: UseChatInputValueOptions) => {
  const [hasInput, setHasInput] = useState(() => initialInput.trim().length > 0);

  useEffect(() => {
    onHasInputChange?.(hasInput);
  }, [hasInput, onHasInputChange]);

  const applyInputValue = useCallback(
    (nextValue: string) => {
      const nextHasInput = nextValue.trim().length > 0;
      const textarea = textareaRef.current;
      if (textarea && textarea.value !== nextValue) {
        textarea.value = nextValue;
      }

      setCurrentInput(nextValue);
      setHasInput(nextHasInput);
      persistDraft(nextValue);
      syncChatInputLayout();
    },
    [persistDraft, setCurrentInput, syncChatInputLayout, textareaRef]
  );

  const clearInputValue = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.value = '';
    }

    setCurrentInput('');
    setHasInput(false);
    syncChatInputLayout();
  }, [setCurrentInput, syncChatInputLayout, textareaRef]);

  return {
    hasInput,
    applyInputValue,
    clearInputValue,
  };
};
