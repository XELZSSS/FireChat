import { memo, useMemo } from 'react';
import { cn } from '@/shared/ui/cn';
import CodeBlockCard from '@client/features/chat/presentation/message-parts/CodeBlockCard';

type MessageMarkdownProps = {
  content: string;
  className?: string;
  renderMode?: 'streaming' | 'light' | 'rich';
  wrapCodeBlocks?: boolean;
};

type MessageSegment =
  | {
      type: 'text';
      content: string;
    }
  | {
      type: 'code';
      content: string;
      language?: string;
    };

type MessageTextSegmentProps = {
  content: string;
};

type MessageCodeSegmentProps = {
  content: string;
  language?: string;
  renderMode: 'streaming' | 'light' | 'rich';
  wrapCodeBlocks: boolean;
};

const parseMessageSegments = (content: string): MessageSegment[] => {
  const lines = content.split('\n');
  const segments: MessageSegment[] = [];
  const textLines: string[] = [];
  let codeLines: string[] = [];
  let codeLanguage: string | undefined;
  let inCodeBlock = false;
  const fencePattern = /^\s*```/;

  const pushTextSegment = () => {
    if (textLines.length === 0) {
      return;
    }

    segments.push({
      type: 'text',
      content: textLines.join('\n'),
    });
    textLines.length = 0;
  };

  const pushCodeSegment = () => {
    segments.push({
      type: 'code',
      content: codeLines.join('\n'),
      language: codeLanguage,
    });
    codeLines = [];
    codeLanguage = undefined;
  };

  for (const line of lines) {
    if (!inCodeBlock && fencePattern.test(line)) {
      pushTextSegment();
      inCodeBlock = true;
      codeLanguage =
        line
          .replace(/^\s*```/, '')
          .trim()
          .split(/\s+/)[0] || undefined;
      continue;
    }

    if (inCodeBlock && fencePattern.test(line)) {
      pushCodeSegment();
      inCodeBlock = false;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    textLines.push(line);
  }

  if (inCodeBlock) {
    pushCodeSegment();
  }

  pushTextSegment();

  return segments;
};

const MessageTextSegment = memo(function MessageTextSegment({ content }: MessageTextSegmentProps) {
  return <div className="min-w-0 whitespace-pre-wrap break-words text-inherit">{content}</div>;
});

const MessageCodeSegment = memo(function MessageCodeSegment({
  content,
  language,
  renderMode,
  wrapCodeBlocks,
}: MessageCodeSegmentProps) {
  return (
    <CodeBlockCard
      code={content}
      language={language}
      renderMode={renderMode}
      defaultCollapsed
      wrapCodeBlocks={wrapCodeBlocks}
    />
  );
});

const RichMessageMarkdownComponent = ({
  content,
  className,
  renderMode = 'rich',
  wrapCodeBlocks = false,
}: MessageMarkdownProps) => {
  const segments = useMemo(() => parseMessageSegments(content), [content]);

  return (
    <div className={cn('min-w-0 text-[14px] leading-7 tracking-[0.002em] text-inherit', className)}>
      {segments.map((segment, index) =>
        segment.type === 'code' ? (
          <MessageCodeSegment
            key={`code-${index}`}
            content={segment.content}
            language={segment.language}
            renderMode={renderMode}
            wrapCodeBlocks={wrapCodeBlocks}
          />
        ) : (
          <MessageTextSegment key={`text-${index}`} content={segment.content} />
        )
      )}
    </div>
  );
};

const RichMessageMarkdown = memo(RichMessageMarkdownComponent);
export default RichMessageMarkdown;

