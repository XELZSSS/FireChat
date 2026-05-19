import { useCallback, type RefObject } from 'react';
import type { ChangeEvent, KeyboardEvent, SyntheticEvent } from 'react';
import type { ChatAttachment, ChatPromptInput } from '@/shared/types/chat';
import type { SendShortcut } from '@/shared/utils/appOptions';

type UseChatInputComposerOptions = {
  currentInputRef: RefObject<string>;
  hasInput: boolean;
  attachments: ChatAttachment[];
  isInputDisabled: boolean;
  isStreaming: boolean;
  onSend: (message: ChatPromptInput) => void;
  onStop: () => void;
  onInputValueChange: (value: string) => void;
  clearInputValue: () => void;
  clearDraft: () => void;
  clearAttachments: () => void;
  sendShortcut: SendShortcut;
};

export const useChatInputComposer = ({
  currentInputRef,
  hasInput,
  attachments,
  isInputDisabled,
  isStreaming,
  onSend,
  onStop,
  onInputValueChange,
  clearInputValue,
  clearDraft,
  clearAttachments,
  sendShortcut,
}: UseChatInputComposerOptions) => {
  const hasAttachments = attachments.length > 0;
  const hasSendableContent = hasInput || hasAttachments;
  const isSendDisabled = isInputDisabled || (!hasSendableContent && !isStreaming);

  const handleSubmit = useCallback(
    (event?: SyntheticEvent) => {
      event?.preventDefault();
      if (!hasSendableContent || isInputDisabled) {
        return;
      }

      if (isStreaming) {
        onStop();
        return;
      }

      const input = currentInputRef.current;
      onSend({
        text: input,
        attachments: hasAttachments ? attachments : undefined,
      });
      clearInputValue();
      clearDraft();
      clearAttachments();
    },
    [
      attachments,
      clearInputValue,
      clearAttachments,
      clearDraft,
      currentInputRef,
      hasAttachments,
      hasSendableContent,
      isInputDisabled,
      isStreaming,
      onSend,
      onStop,
    ]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter') {
        return;
      }

      const shouldSubmit =
        (sendShortcut === 'enter' && !event.shiftKey) ||
        (sendShortcut === 'ctrl_enter' && (event.ctrlKey || event.metaKey)) ||
        (sendShortcut === 'alt_enter' && event.altKey) ||
        (sendShortcut === 'meta_enter' && event.metaKey);

      if (shouldSubmit) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, sendShortcut]
  );

  const handleSendClick = useCallback(() => {
    if (isStreaming) {
      onStop();
      return;
    }

    handleSubmit();
  }, [handleSubmit, isStreaming, onStop]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onInputValueChange(event.target.value);
    },
    [onInputValueChange]
  );

  return {
    hasInput,
    hasAttachments,
    hasSendableContent,
    isSendDisabled,
    handleInputChange,
    handleKeyDown,
    handleSendClick,
    handleSubmit,
  };
};
