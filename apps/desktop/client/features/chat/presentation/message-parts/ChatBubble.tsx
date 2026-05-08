import { memo, useState } from 'react';
import { ChatMessage } from '@/shared/types/chat';
import type { Language } from '@/shared/utils/i18n';
import { t } from '@/shared/utils/i18n';
import { CheckIcon, ContentCopyIcon } from '@/shared/ui/icons';
import MessageMarkdown from '@client/features/chat/presentation/message-parts/MessageMarkdown';
import { CitationsSection } from '@client/features/chat/presentation/chatBubbleParts/CitationsSection';
import { GeneratedImagesSection } from '@client/features/chat/presentation/chatBubbleParts/GeneratedImagesSection';
import { MessageAttachmentsSection } from '@client/features/chat/presentation/chatBubbleParts/MessageAttachmentsSection';
import { ReasoningIndicator } from '@client/features/chat/presentation/chatBubbleParts/ReasoningIndicator';
import { TextContent } from '@client/features/chat/presentation/chatBubbleParts/TextContent';
import {
  ToolCallsSection,
  ToolResultsSection,
} from '@client/features/chat/presentation/chatBubbleParts/ToolSections';
import { TypingIndicator } from '@client/features/chat/presentation/chatBubbleParts/TypingIndicator';
import { useTimedClipboardCopy } from '@client/features/chat/presentation/shell/useTimedClipboardCopy';
import {
  getChatBubbleViewModel,
  PLAIN_MESSAGE_TEXT_CLASS,
} from '@client/features/chat/presentation/message-parts/chatBubbleViewModel';

interface ChatBubbleProps {
  language: Language;
  message: ChatMessage;
  isStreaming?: boolean;
  showMessageTimestamps?: boolean;
  wrapCodeBlocks?: boolean;
}

type MessageMetaProps = {
  messageTimeLabel: string;
  showMessageTimeLabel: boolean;
  showCopyButton: boolean;
  isCopied: boolean;
  onCopy: () => void;
};

const MessageMeta = memo(function MessageMeta({
  messageTimeLabel,
  showMessageTimeLabel,
  showCopyButton,
  isCopied,
  onCopy,
}: MessageMetaProps) {
  return (
    <div className="group mt-2 inline-flex items-center gap-1.5 text-[10px] leading-4 tracking-[0.02em] text-[var(--ink-3)]">
      {showMessageTimeLabel ? <span>{messageTimeLabel}</span> : null}
      {showCopyButton ? (
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-4 max-w-0 items-center gap-1 overflow-hidden text-[var(--ink-3)] opacity-0 transition-[max-width,opacity,color] duration-[var(--motion-base)] ease-[var(--motion-ease-standard)] group-hover:max-w-12 group-hover:opacity-100 hover:text-[var(--ink-1)] focus-visible:max-w-12 focus-visible:opacity-100 focus-visible:outline-none"
          aria-label={t('copy.copy')}
          title={t('copy.copy')}
        >
          {isCopied ? (
            <CheckIcon size={12} strokeWidth={2} />
          ) : (
            <ContentCopyIcon size={12} strokeWidth={2} />
          )}
        </button>
      ) : null}
    </div>
  );
});

const ChatBubble = ({
  language,
  message,
  isStreaming = false,
  showMessageTimestamps = true,
  wrapCodeBlocks = false,
}: ChatBubbleProps) => {
  const viewModel = getChatBubbleViewModel({ message, isStreaming });
  const [areCitationsOpen, setAreCitationsOpen] = useState(false);
  const { isCopied, copyText: copyTextToClipboard } = useTimedClipboardCopy({
    errorMessage: 'Failed to copy message text:',
  });

  const messageMeta =
    viewModel.showCopyButton || (showMessageTimestamps && viewModel.messageTimeLabel) ? (
      <MessageMeta
        messageTimeLabel={viewModel.messageTimeLabel}
        showMessageTimeLabel={showMessageTimestamps && Boolean(viewModel.messageTimeLabel)}
        showCopyButton={viewModel.showCopyButton}
        isCopied={isCopied}
        onCopy={() => {
          void copyTextToClipboard(viewModel.copyText);
        }}
      />
    ) : null;

  return (
    <div className="chat-bubble-shell mb-6 flex w-full" data-language={language}>
      <div className={`flex min-w-0 w-full gap-4 ${viewModel.containerAlignment}`}>
        <div className={`flex min-w-0 w-full flex-col ${viewModel.messageAlignment}`}>
          <div className={viewModel.messageContentClass}>
            {viewModel.isUser ? (
              <>
                {viewModel.hasAttachments && (
                  <MessageAttachmentsSection attachments={viewModel.attachments} />
                )}
                {viewModel.hasText ? (
                  viewModel.hasCodeBlock ? (
                    <MessageMarkdown
                      content={viewModel.text}
                      renderMode={isStreaming ? 'streaming' : 'rich'}
                      wrapCodeBlocks={wrapCodeBlocks}
                    />
                  ) : (
                    <TextContent
                      text={viewModel.text}
                      as="div"
                      className={`${PLAIN_MESSAGE_TEXT_CLASS} text-[var(--ink-1)]`}
                    />
                  )
                ) : null}
              </>
            ) : (
              <div className="min-w-0">
                {viewModel.hasAttachments && (
                  <MessageAttachmentsSection attachments={viewModel.attachments} />
                )}
                {(viewModel.isReasoning || viewModel.hasReasoning) && (
                  <ReasoningIndicator
                    key={viewModel.reasoningCardKey}
                    isStreaming={viewModel.isReasoning}
                    reasoning={viewModel.reasoningText || undefined}
                    initialOpen={viewModel.isReasoning}
                  />
                )}

                {viewModel.hasToolCalls && <ToolCallsSection toolCalls={viewModel.toolCalls} />}
                {viewModel.hasToolResults && (
                  <ToolResultsSection toolResults={viewModel.toolResults} />
                )}
                {viewModel.hasGeneratedImages && (
                  <GeneratedImagesSection images={viewModel.generatedImages} />
                )}
                {!viewModel.hasText && isStreaming && !viewModel.isReasoning && <TypingIndicator />}
                {viewModel.hasText ? (
                  viewModel.hasCodeBlock ? (
                    <MessageMarkdown
                      content={viewModel.text}
                      className="text-[var(--ink-2)]"
                      renderMode={isStreaming ? 'streaming' : 'rich'}
                      wrapCodeBlocks={wrapCodeBlocks}
                    />
                  ) : (
                    <TextContent
                      text={viewModel.text}
                      as="div"
                      className={`${PLAIN_MESSAGE_TEXT_CLASS} text-[var(--ink-2)]`}
                    />
                  )
                ) : null}

                {viewModel.hasCitations && (
                  <CitationsSection
                    citations={viewModel.citations}
                    areCitationsOpen={areCitationsOpen}
                    onToggle={() => {
                      setAreCitationsOpen((prev) => !prev);
                    }}
                  />
                )}
                {messageMeta}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const areChatBubbleEqual = (prev: ChatBubbleProps, next: ChatBubbleProps): boolean => {
  if (prev.language !== next.language) return false;
  if (prev.isStreaming !== next.isStreaming) return false;
  if (prev.showMessageTimestamps !== next.showMessageTimestamps) return false;
  if (prev.wrapCodeBlocks !== next.wrapCodeBlocks) return false;

  const prevMessage = prev.message;
  const nextMessage = next.message;
  return (
    prevMessage.id === nextMessage.id &&
    prevMessage.role === nextMessage.role &&
    prevMessage.isError === nextMessage.isError &&
    prevMessage.timeLabel === nextMessage.timeLabel &&
    prevMessage.timestamp === nextMessage.timestamp &&
    prevMessage.parts === nextMessage.parts
  );
};

export default memo(ChatBubble, areChatBubbleEqual);

