import { memo, useCallback, useState } from 'react';
import ChatInput from '@client/features/chat/presentation/input/ChatInput';
import ChatMessageList from '@client/features/chat/presentation/message-list/ChatMessageList';
import ChatPet from '@client/features/pet/presentation/ChatPet';
import ChatScrollToBottomButton from '@client/features/chat/presentation/message-list/ChatScrollToBottomButton';
import WelcomeScreen from '@client/features/chat/presentation/shell/WelcomeScreen';
import { usePetController } from '@client/features/pet/application/usePetController';
import {
  CHAT_INPUT_RESERVED_SPACE,
  MAIN_CLASS,
  MESSAGES_CONTAINER_CLASS,
  MESSAGES_CONTENT_CLASS,
} from '@client/features/chat/presentation/shell/chatMainConstants';
import type { ChatMainProps } from '@client/features/chat/presentation/shell/chatMainTypes';

const MAIN_INPUT_DOCK_CLASS = 'relative mx-auto w-full max-w-[min(50rem,100%)] px-4 pb-3';
const MAIN_INPUT_LAYER_CLASS = 'pointer-events-none absolute inset-x-0 bottom-0 z-20';
const MAIN_PET_DOCK_CLASS = 'pet-inline-dock flex w-full px-3 pb-[0.12rem]';
const WELCOME_INPUT_CLASS = 'w-full max-w-[min(50rem,100%)] px-4';

const ChatMainComponent = ({
  language,
  sessionId,
  isSessionStateReady,
  messages,
  isStreaming,
  isLoading,
  messagesContentRef,
  messagesContainerRef,
  messagesEndRef,
  showScrollToBottom,
  onJumpToBottom,
  onSendMessage,
  onStopStreaming,
  reasoningEnabled,
  reasoningControlVisible,
  reasoningLevel,
  reasoningLevelOptions,
  reasoningLevelSupported,
  reasoningToggleLocked,
  sendShortcut,
  showMessageTimestamps,
  wrapCodeBlocks,
  petSettings,
  searchEnabled,
  imageGenerationEnabled,
  imageGenerationAvailable,
  searchAvailable,
  onReasoningLevelChange,
  onToggleReasoning,
  onToggleSearch,
  onToggleImageGeneration,
}: ChatMainProps) => {
  const [inputValueState, setInputValueState] = useState({ sessionId, hasInput: false });
  const hasMessages = messages.length > 0;
  const petSurface = hasMessages ? 'chat' : 'welcome';
  const hasInputValue = inputValueState.sessionId === sessionId && inputValueState.hasInput;
  const scrollPaddingBottom = hasMessages ? CHAT_INPUT_RESERVED_SPACE : '0px';
  const showScrollButton = isSessionStateReady && hasMessages && showScrollToBottom;
  const showChatInput = isSessionStateReady && hasMessages;
  const pet = usePetController({
    sessionId,
    surface: petSurface,
    messages,
    isLoading,
    isStreaming,
    hasInputValue,
    reasoningEnabled,
    settings: petSettings,
  });
  const handleHasInputChange = useCallback(
    (nextHasInput: boolean) => {
      setInputValueState((current) =>
        current.sessionId === sessionId && current.hasInput === nextHasInput
          ? current
          : { sessionId, hasInput: nextHasInput }
      );
    },
    [sessionId]
  );
  const chatPet = pet.visible ? (
    <div className={MAIN_PET_DOCK_CLASS} data-position={pet.settings.position}>
      <ChatPet status={pet.status} settings={pet.settings} />
    </div>
  ) : null;

  const sharedChatInputProps = {
    language,
    sessionId,
    onSend: onSendMessage,
    disabled: isLoading,
    isStreaming,
    onStop: onStopStreaming,
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
    onHasInputChange: handleHasInputChange,
    onReasoningLevelChange,
    onToggleReasoning,
    onToggleSearch,
    onToggleImageGeneration,
  };
  const welcomeInput = (
    <ChatInput
      key={`welcome-${sessionId}`}
      {...sharedChatInputProps}
      showEmojiButton={false}
      containerClassName={WELCOME_INPUT_CLASS}
    />
  );

  return (
    <main className={MAIN_CLASS} data-language={language}>
      <div
        ref={messagesContainerRef}
        className={MESSAGES_CONTAINER_CLASS}
        style={{ scrollPaddingBottom }}
      >
        {!isSessionStateReady ? null : !hasMessages ? (
          <div ref={messagesContentRef} className={MESSAGES_CONTENT_CLASS}>
            <WelcomeScreen input={welcomeInput} pet={chatPet} />
          </div>
        ) : (
          <ChatMessageList
            language={language}
            messages={messages}
            isStreaming={isStreaming}
            showMessageTimestamps={showMessageTimestamps}
            wrapCodeBlocks={wrapCodeBlocks}
            messagesContentRef={messagesContentRef}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
            scrollPaddingBottom={scrollPaddingBottom}
          />
        )}
      </div>

      {showScrollButton && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
          <ChatScrollToBottomButton onJumpToBottom={onJumpToBottom} />
        </div>
      )}
      {showChatInput && (
        <div className={MAIN_INPUT_LAYER_CLASS}>
          <div className={MAIN_INPUT_DOCK_CLASS}>
            {chatPet}
            <ChatInput
              key={`main-${sessionId}`}
              {...sharedChatInputProps}
              showEmojiButton
              containerClassName="pointer-events-auto"
            />
          </div>
        </div>
      )}
    </main>
  );
};

const ChatMain = memo(ChatMainComponent);
export default ChatMain;

