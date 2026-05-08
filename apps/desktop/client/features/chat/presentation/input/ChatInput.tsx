import { memo } from 'react';
import type { ChatPromptInput } from '@/shared/types/chat';
import { CHAT_ATTACHMENT_FILE_ACCEPT } from '@/shared/utils/chatAttachments';
import { t, type Language } from '@/shared/utils/i18n';
import { cn } from '@/shared/ui/cn';
import {
  CONTAINER_CLASS,
  INPUT_SHELL_CLASS,
  TEXTAREA_CLASS,
} from '@client/features/chat/presentation/input/chatInputHelpers';
import { ChatInputAttachmentChip } from '@client/features/chat/presentation/input/chatInputParts';
import AttachmentParseDialog from '@client/features/chat/presentation/dialogs/AttachmentParseDialog';
import AttachmentRejectDialog from '@client/features/chat/presentation/dialogs/AttachmentRejectDialog';
import { ChatInputEmojiPicker } from '@client/features/chat/presentation/input/ChatInputEmojiPicker';
import { ChatInputActionBar } from '@client/features/chat/presentation/input/ChatInputActionBar';
import {
  useChatInputController,
  type ChatInputController,
} from '@client/features/chat/presentation/input/useChatInputController';
import type { ReasoningLevel } from '@/infrastructure/providers/types';
import type { SendShortcut } from '@/shared/utils/appOptions';

interface ChatInputProps {
  language: Language;
  sessionId: string;
  onSend: (message: ChatPromptInput) => void;
  disabled: boolean;
  isStreaming: boolean;
  onStop: () => void;
  containerClassName?: string;
  reasoningEnabled: boolean;
  reasoningControlVisible: boolean;
  reasoningLevel: ReasoningLevel;
  reasoningLevelOptions: ReasoningLevel[];
  reasoningLevelSupported: boolean;
  reasoningToggleLocked: boolean;
  sendShortcut: SendShortcut;
  searchEnabled: boolean;
  imageGenerationEnabled: boolean;
  imageGenerationAvailable: boolean;
  searchAvailable: boolean;
  showEmojiButton?: boolean;
  onHasInputChange?: (hasInput: boolean) => void;
  onReasoningLevelChange: (level: ReasoningLevel) => void;
  onToggleReasoning: () => void;
  onToggleSearch: () => void;
  onToggleImageGeneration: () => void;
}

type ChatInputAttachmentsListProps = {
  attachments: ChatInputController['attachments'];
  onRemove: (attachmentId: string) => void;
};

const ChatInputAttachmentsList = memo(function ChatInputAttachmentsList({
  attachments,
  onRemove,
}: ChatInputAttachmentsListProps) {
  return (
    <div className="flex w-full flex-wrap gap-2.5 px-1 py-1">
      {attachments.map((attachment) => (
        <ChatInputAttachmentChip
          key={attachment.id}
          attachment={attachment}
          removeLabel={t('input.attach.remove')}
          truncatedLabel={t('input.attach.truncated')}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
});

const ChatInputComponent = ({
  language,
  sessionId,
  onSend,
  disabled,
  isStreaming,
  onStop,
  containerClassName,
  reasoningEnabled,
  reasoningControlVisible,
  reasoningLevel,
  reasoningLevelOptions,
  reasoningLevelSupported,
  reasoningToggleLocked,
  sendShortcut,
  searchEnabled,
  imageGenerationEnabled,
  imageGenerationAvailable,
  searchAvailable,
  showEmojiButton = true,
  onHasInputChange,
  onReasoningLevelChange,
  onToggleReasoning,
  onToggleSearch,
  onToggleImageGeneration,
}: ChatInputProps) => {
  const {
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
    isInputDisabled,
    isSearchDisabled,
    isSendDisabled,
    isDragActive,
    attachmentButtonToneClass,
    reasoningButtonToneClass,
    searchButtonToneClass,
    imageGenerationButtonToneClass,
    sendButtonToneClass,
    emojiButtonToneClass,
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
  } = useChatInputController({
    sessionId,
    onSend,
    disabled,
    isStreaming,
    onStop,
    reasoningEnabled,
    searchEnabled,
    imageGenerationEnabled,
    searchAvailable,
    sendShortcut,
    onHasInputChange,
  });

  return (
    <div
      ref={containerRef}
      data-language={language}
      className={cn(CONTAINER_CLASS, containerClassName)}
    >
      <div
        className={cn(
          INPUT_SHELL_CLASS,
          'flex-col items-stretch',
          isDragActive && 'border-[var(--accent)] bg-[var(--bg-0)]'
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={CHAT_ATTACHMENT_FILE_ACCEPT}
          className="sr-only"
          onChange={handleFileInputChange}
          tabIndex={-1}
        />
        {hasAttachments ? (
          <ChatInputAttachmentsList attachments={attachments} onRemove={removeAttachment} />
        ) : null}
        {attachmentNotice ? (
          <p className="w-full px-3 text-[11px] leading-5 tracking-[0.015em] text-[var(--status-error-border)]">
            {attachmentNotice}
          </p>
        ) : null}
        <div className="relative w-full">
          <ChatInputEmojiPicker
            isOpen={isEmojiPickerVisible}
            pickerRef={emojiPickerRef}
            emojiGroups={visibleEmojiGroups}
            onSelectEmoji={handleEmojiClick}
            onClearRecent={handleClearRecentEmojis}
          />
          <textarea
            ref={textareaRef}
            defaultValue={initialInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={TEXTAREA_CLASS}
            rows={1}
            placeholder={t('input.placeholder.chat')}
            disabled={isInputDisabled}
          />
        </div>
        <ChatInputActionBar
          isInputDisabled={isInputDisabled}
          isSearchDisabled={isSearchDisabled}
          isStreaming={isStreaming}
          isSendDisabled={isSendDisabled}
          reasoningControlVisible={reasoningControlVisible}
          reasoningEnabled={reasoningEnabled}
          reasoningLevel={reasoningLevel}
          reasoningLevelOptions={reasoningLevelOptions}
          reasoningLevelSupported={reasoningLevelSupported}
          reasoningToggleLocked={reasoningToggleLocked}
          searchEnabled={searchEnabled}
          imageGenerationEnabled={imageGenerationEnabled}
          imageGenerationAvailable={imageGenerationAvailable}
          showEmojiButton={showEmojiButton}
          emojiPickerOpen={isEmojiPickerVisible}
          attachmentButtonToneClass={attachmentButtonToneClass}
          reasoningButtonToneClass={reasoningButtonToneClass}
          searchButtonToneClass={searchButtonToneClass}
          imageGenerationButtonToneClass={imageGenerationButtonToneClass}
          sendButtonToneClass={sendButtonToneClass}
          emojiButtonToneClass={emojiButtonToneClass}
          onOpenFilePicker={openFilePicker}
          onToggleEmojiPicker={handleToggleEmojiPicker}
          onToggleReasoning={onToggleReasoning}
          onReasoningLevelChange={onReasoningLevelChange}
          onToggleSearch={onToggleSearch}
          onToggleImageGeneration={onToggleImageGeneration}
          onSendClick={handleSendClick}
          emojiButtonRef={emojiButtonRef}
        />
      </div>

      <AttachmentParseDialog
        isOpen={isParseDialogOpen}
        attachments={pendingStructuredAttachments}
        onClose={closeParseDialog}
        onConfirm={confirmStructuredAttachmentParsing}
        onChangePageRange={handlePendingAttachmentPageRangeChange}
      />
      <AttachmentRejectDialog
        isOpen={isRejectedAttachmentDialogOpen}
        messages={rejectedAttachmentMessages}
        onClose={closeRejectedAttachmentDialog}
      />
    </div>
  );
};

const ChatInput = memo(ChatInputComponent);
export default ChatInput;

