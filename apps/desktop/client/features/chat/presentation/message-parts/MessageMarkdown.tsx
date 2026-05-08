import { memo } from 'react';
import { cn } from '@/shared/ui/cn';
import RichMessageMarkdown from '@client/features/chat/presentation/message-parts/RichMessageMarkdown';

type MessageMarkdownProps = {
  content: string;
  className?: string;
  renderMode?: 'streaming' | 'light' | 'rich';
  wrapCodeBlocks?: boolean;
};

const CODE_FENCE_PATTERN = /(^|\n)\s*```/;

export const hasRenderableCodeBlock = (content: string) => CODE_FENCE_PATTERN.test(content);

const LightMessageMarkdown = memo(function LightMessageMarkdown({
  content,
  className,
}: MessageMarkdownProps) {
  return (
    <div
      className={cn(
        'min-w-0 whitespace-pre-wrap break-words text-[14px] leading-7 tracking-[0.002em] text-inherit',
        className
      )}
    >
      {content}
    </div>
  );
});

const MessageMarkdownComponent = ({
  content,
  className,
  renderMode = 'rich',
  wrapCodeBlocks = false,
}: MessageMarkdownProps) => {
  const shouldUseRichRenderer = renderMode !== 'light' && hasRenderableCodeBlock(content);

  if (shouldUseRichRenderer) {
    return (
      <RichMessageMarkdown
        content={content}
        className={className}
        renderMode={renderMode}
        wrapCodeBlocks={wrapCodeBlocks}
      />
    );
  }

  return <LightMessageMarkdown content={content} className={className} renderMode={renderMode} />;
};

const MessageMarkdown = memo(MessageMarkdownComponent);
export default MessageMarkdown;

