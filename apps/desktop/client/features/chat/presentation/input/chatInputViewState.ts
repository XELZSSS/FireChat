import { resolveChatInputActionToneClass } from '@client/features/chat/presentation/input/chatInputParts';

export const getChatInputViewState = ({
  disabled,
  isStreaming,
  searchAvailable,
  hasAttachments,
  hasSendableContent,
  reasoningEnabled,
  searchEnabled,
  imageGenerationEnabled,
  isEmojiPickerVisible,
}: {
  disabled: boolean;
  isStreaming: boolean;
  searchAvailable: boolean;
  hasAttachments: boolean;
  hasSendableContent: boolean;
  reasoningEnabled: boolean;
  searchEnabled: boolean;
  imageGenerationEnabled: boolean;
  isEmojiPickerVisible: boolean;
}) => {
  const isInputDisabled = disabled && !isStreaming;

  return {
    isInputDisabled,
    isSearchDisabled: isInputDisabled || !searchAvailable,
    attachmentButtonToneClass: resolveChatInputActionToneClass(hasAttachments),
    reasoningButtonToneClass: resolveChatInputActionToneClass(reasoningEnabled),
    searchButtonToneClass: resolveChatInputActionToneClass(searchEnabled),
    imageGenerationButtonToneClass: resolveChatInputActionToneClass(imageGenerationEnabled),
    sendButtonToneClass: resolveChatInputActionToneClass(hasSendableContent || isStreaming),
    emojiButtonToneClass: resolveChatInputActionToneClass(isEmojiPickerVisible),
  };
};

