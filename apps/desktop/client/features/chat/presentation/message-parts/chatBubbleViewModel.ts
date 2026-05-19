import { Role, type ChatMessage } from '@/shared/types/chat';
import {
  getMessageAttachments,
  getMessageCitations,
  getMessageToolCalls,
  getMessageToolResults,
  readMessagePartState,
} from '@/shared/utils/chatMessageParts';
import { hasRenderableCodeBlock } from '@client/features/chat/presentation/message-parts/MessageMarkdown';

const EMPTY_ATTACHMENTS: ReturnType<typeof getMessageAttachments> = [];
const EMPTY_TOOL_CALLS: ReturnType<typeof getMessageToolCalls> = [];
const EMPTY_TOOL_RESULTS: ReturnType<typeof getMessageToolResults> = [];
const EMPTY_CITATIONS: ReturnType<typeof getMessageCitations> = [];

type ChatBubbleViewModelOptions = {
  message: ChatMessage;
  isStreaming: boolean;
};

export const PLAIN_MESSAGE_TEXT_CLASS =
  'min-w-0 whitespace-pre-wrap break-words text-[14px] leading-6 tracking-[0.002em]';

export const getChatBubbleViewModel = ({ message, isStreaming }: ChatBubbleViewModelOptions) => {
  const isUser = message.role === Role.User;
  const isError = message.isError;
  const partState = readMessagePartState(message);
  const text = partState.text;
  const attachments = partState.attachments ?? EMPTY_ATTACHMENTS;
  const toolCalls = isUser ? EMPTY_TOOL_CALLS : partState.toolCalls;
  const toolResults = isUser ? EMPTY_TOOL_RESULTS : partState.toolResults;
  const citations = isUser ? EMPTY_CITATIONS : partState.citations;
  const reasoningStatus = isUser ? undefined : partState.reasoningStatus;
  const reasoningText = isUser ? '' : partState.reasoning.trim();
  const isReasoning = reasoningStatus === 'streaming' && isStreaming;
  const messageTimeLabel = message.timeLabel?.trim() || '';
  const copyText = text.trim() || reasoningText || '';

  return {
    isUser,
    isError,
    text,
    hasText: text.length > 0,
    attachments,
    hasAttachments: attachments.length > 0,
    toolCalls,
    hasToolCalls: toolCalls.length > 0,
    toolResults,
    hasToolResults: toolResults.length > 0,
    citations,
    hasCitations: citations.length > 0,
    reasoningText,
    isReasoning,
    hasReasoning: reasoningText.length > 0 && !isReasoning,
    reasoningCardKey: `${message.id}:${isReasoning ? 'streaming' : 'settled'}`,
    messageTimeLabel,
    copyText,
    showCopyButton: !isUser && Boolean(copyText),
    hasCodeBlock: hasRenderableCodeBlock(text),
    containerAlignment: isUser ? 'justify-end flex-row pl-10' : 'justify-start flex-row',
    messageAlignment: isUser ? 'items-end max-w-[min(40rem,82%)]' : 'items-start max-w-full',
    messageContentClass: isUser
      ? 'border border-[var(--line-1)] bg-[var(--bg-1)] px-3 py-2 text-[var(--ink-1)]'
      : isError
        ? ' border border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-4 py-3 text-[var(--text-on-brand)]'
        : 'px-1 py-1 text-[var(--ink-2)]',
  };
};
