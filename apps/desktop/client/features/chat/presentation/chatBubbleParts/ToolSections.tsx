import { memo } from 'react';
import { t } from '@/shared/utils/i18n';
import type { ChatToolCall, ChatToolResult } from '@/shared/types/chat';
import {
  TOOL_CARD_BASE_CLASS,
  TOOL_CARD_VARIANT_CLASS,
} from '@client/features/chat/presentation/chatBubbleParts/constants';
import { TextContent } from '@client/features/chat/presentation/chatBubbleParts/TextContent';

type ToolCardProps = {
  className: string;
  title: string;
  content: string;
};

const ToolCard = memo(function ToolCard({ className, title, content }: ToolCardProps) {
  return (
    <div className={className}>
      <div className="mb-1 text-[11px] font-medium tracking-[0.02em] text-[var(--ink-2)]">
        {title}
      </div>
      <TextContent
        as="p"
        text={content}
        className="whitespace-pre-wrap break-words leading-6 tracking-[0.003em]"
      />
    </div>
  );
});

const getToolToneClassName = ({
  source,
  isError = false,
}: {
  source?: 'custom' | 'native';
  isError?: boolean;
}) => {
  if (isError) return TOOL_CARD_VARIANT_CLASS.error;
  if (source === 'native') return TOOL_CARD_VARIANT_CLASS.native;
  return TOOL_CARD_VARIANT_CLASS.default;
};

const renderToolHeader = ({
  source,
  provider,
  name,
  resultLabel,
}: {
  source?: 'custom' | 'native';
  provider?: string;
  name: string;
  resultLabel?: string;
}) => {
  const sourceLabel =
    source !== 'native'
      ? t('chat.tool.custom')
      : provider === 'openai'
        ? t('chat.tool.native.openai')
        : t('chat.tool.native.generic');

  return resultLabel ? `${sourceLabel} ${resultLabel}: ${name}` : `${sourceLabel}: ${name}`;
};

export const ToolCallsSection = memo(function ToolCallsSection({
  toolCalls,
}: {
  toolCalls: ChatToolCall[];
}) {
  return (
    <div className="mb-3 space-y-2.5">
      {toolCalls.map((toolCall) => (
        <ToolCard
          key={toolCall.id}
          className={`${TOOL_CARD_BASE_CLASS} ${getToolToneClassName({ source: toolCall.source })}`}
          title={renderToolHeader({
            source: toolCall.source,
            provider: toolCall.provider,
            name: toolCall.name,
          })}
          content={toolCall.argumentsText}
        />
      ))}
    </div>
  );
});

export const ToolResultsSection = memo(function ToolResultsSection({
  toolResults,
}: {
  toolResults: ChatToolResult[];
}) {
  return (
    <div className="mb-3 space-y-2.5">
      {toolResults.map((toolResult) => (
        <ToolCard
          key={toolResult.id}
          className={`${TOOL_CARD_BASE_CLASS} ${getToolToneClassName({
            source: toolResult.source,
            isError: toolResult.isError,
          })}`}
          title={renderToolHeader({
            source: toolResult.source,
            provider: toolResult.provider,
            name: toolResult.name,
            resultLabel: t('chat.tool.result'),
          })}
          content={toolResult.outputText}
        />
      ))}
    </div>
  );
});
