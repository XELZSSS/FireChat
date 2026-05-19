import { useCallback, useRef } from 'react';
import type { ChatPromptInput } from '@/shared/types/chat';
import type { SendShortcut } from '@/shared/utils/appOptions';
import { useChatInputDraft } from '@client/features/chat/presentation/input/useChatInputDraft';
import { useChatInputAttachments } from '@client/features/chat/presentation/input/useChatInputAttachments';
import { useChatInputComposer } from '@client/features/chat/presentation/input/useChatInputComposer';
import { useChatInputDragDrop } from '@client/features/chat/presentation/input/useChatInputDragDrop';
import { useChatInputEmoji } from '@client/features/chat/presentation/input/useChatInputEmoji';
import { useChatInputLayout } from '@client/features/chat/presentation/input/useChatInputLayout';
import { useChatInputValue } from '@client/features/chat/presentation/input/useChatInputValue';
import { getChatInputViewState } from '@client/features/chat/presentation/input/chatInputViewState';

type UseChatInputControllerOptions = {
  sessionId: string;
  onSend: (message: ChatPromptInput) => void;
  disabled: boolean;
  isStreaming: boolean;
  onStop: () => void;
  reasoningEnabled: boolean;
  sendShortcut: SendShortcut;
  onHasInputChange?: (hasInput: boolean) => void;
};

export const useChatInputController = ({
  sessionId,
  onSend,
  disabled,
  isStreaming,
  onStop,
  reasoningEnabled,
  sendShortcut,
  onHasInputChange,
}: UseChatInputControllerOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const isInputDisabled = disabled && !isStreaming;

  const { clearDraft, currentInputRef, initialInput, persistDraft, setCurrentInput } =
    useChatInputDraft({ sessionId });
  const {
    attachments,
    appendFiles,
    attachmentNotice,
    clearAttachments,
    closeParseDialog,
    closeRejectedAttachmentDialog,
    confirmStructuredAttachmentParsing,
    fileInputRef,
    handleFileInputChange,
    isParseDialogOpen,
    isRejectedAttachmentDialogOpen,
    openFilePicker,
    pendingStructuredAttachments,
    rejectedAttachmentMessages,
    removeAttachment,
    updatePendingStructuredAttachment,
  } = useChatInputAttachments();

  const { syncChatInputLayout } = useChatInputLayout({ containerRef });
  const { hasInput, applyInputValue, clearInputValue } = useChatInputValue({
    initialInput,
    textareaRef,
    setCurrentInput,
    persistDraft,
    syncChatInputLayout,
    onHasInputChange,
  });
  const {
    hasAttachments,
    hasSendableContent,
    isSendDisabled,
    handleInputChange,
    handleKeyDown,
    handleSendClick,
  } = useChatInputComposer({
    currentInputRef,
    hasInput,
    attachments,
    isInputDisabled,
    isStreaming,
    onSend,
    onStop,
    onInputValueChange: applyInputValue,
    clearInputValue,
    clearDraft,
    clearAttachments,
    sendShortcut,
  });
  const {
    isEmojiPickerVisible,
    handleToggleEmojiPicker,
    handleEmojiClick,
    handleClearRecentEmojis,
    visibleEmojiGroups,
  } = useChatInputEmoji({
    disabled: isInputDisabled,
    currentInputRef,
    applyInputValue,
    textareaRef,
    emojiPickerRef,
    emojiButtonRef,
  });
  const viewState = getChatInputViewState({
    disabled,
    isStreaming,
    hasAttachments,
    hasSendableContent,
    reasoningEnabled,
    isEmojiPickerVisible,
  });

  const handlePendingAttachmentPageRangeChange = useCallback(
    (attachmentId: string, pageRange: string) => {
      updatePendingStructuredAttachment(attachmentId, { pageRange });
    },
    [updatePendingStructuredAttachment]
  );

  const { isDragActive, handleDragEnter, handleDragOver, handleDragLeave, handleDrop } =
    useChatInputDragDrop({
      disabled: isInputDisabled,
      appendFiles,
    });

  return {
    containerRef,
    textareaRef,
    emojiPickerRef,
    emojiButtonRef,
    fileInputRef,
    initialInput,
    attachments,
    hasAttachments,
    attachmentNotice,
    isParseDialogOpen,
    isRejectedAttachmentDialogOpen,
    pendingStructuredAttachments,
    rejectedAttachmentMessages,
    visibleEmojiGroups,
    isEmojiPickerVisible,
    isSendDisabled,
    isDragActive,
    handleFileInputChange,
    openFilePicker,
    removeAttachment,
    closeParseDialog,
    closeRejectedAttachmentDialog,
    confirmStructuredAttachmentParsing,
    handleInputChange,
    handleKeyDown,
    handleSendClick,
    handleToggleEmojiPicker,
    handleEmojiClick,
    handleClearRecentEmojis,
    handlePendingAttachmentPageRangeChange,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    ...viewState,
  };
};

export type ChatInputController = ReturnType<typeof useChatInputController>;
