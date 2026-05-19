import { resolveChatInputActionToneClass } from '@client/features/chat/presentation/input/chatInputParts';

export const getChatInputViewState = ({
  disabled,
  isStreaming,
  hasAttachments,
  hasSendableContent,
  reasoningEnabled,
  isEmojiPickerVisible,
}: {
  disabled: boolean;
  isStreaming: boolean;
  hasAttachments: boolean;
  hasSendableContent: boolean;
  reasoningEnabled: boolean;
  isEmojiPickerVisible: boolean;
}) => {
  const isInputDisabled = disabled && !isStreaming;

  return {
    isInputDisabled,
    attachmentButtonToneClass: resolveChatInputActionToneClass(hasAttachments),
    reasoningButtonToneClass: resolveChatInputActionToneClass(reasoningEnabled),
    sendButtonToneClass: resolveChatInputActionToneClass(hasSendableContent || isStreaming),
    emojiButtonToneClass: resolveChatInputActionToneClass(isEmojiPickerVisible),
  };
};
