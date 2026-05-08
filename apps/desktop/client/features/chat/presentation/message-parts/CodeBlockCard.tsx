import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { t } from '@/shared/utils/i18n';
import { CheckIcon, ContentCopyIcon, DownloadIcon } from '@/shared/ui/icons';
import { useTimedClipboardCopy } from '@client/features/chat/presentation/shell/useTimedClipboardCopy';
import CodeBlockSyntaxHighlighter from '@client/features/chat/presentation/message-parts/CodeBlockSyntaxHighlighter';

type CodeBlockCardProps = {
  code: string;
  language?: string;
  renderMode?: 'streaming' | 'light' | 'rich';
  defaultCollapsed?: boolean;
  wrapCodeBlocks?: boolean;
};

type CodeBlockActionButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

const CODE_FILE_EXTENSIONS: Record<string, string> = {
  bash: 'sh',
  cjs: 'cjs',
  css: 'css',
  html: 'html',
  javascript: 'js',
  js: 'js',
  json: 'json',
  jsx: 'jsx',
  markdown: 'md',
  md: 'md',
  python: 'py',
  py: 'py',
  shell: 'sh',
  sh: 'sh',
  sql: 'sql',
  text: 'txt',
  toml: 'toml',
  ts: 'ts',
  tsx: 'tsx',
  typescript: 'ts',
  xml: 'xml',
  yaml: 'yml',
  yml: 'yml',
};
const ACTION_BUTTON_CLASS =
  'code-block-action-button inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2';
const DISABLED_ACTION_BUTTON_CLASS = 'disabled:cursor-default';
const CODE_FONT_FAMILY =
  '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const normalizeLanguage = (language?: string) =>
  String(language ?? '')
    .trim()
    .toLowerCase();

const getLanguageLabel = (language?: string) => normalizeLanguage(language) || 'text';

const getDownloadFileName = (language?: string) => {
  const normalizedLanguage = getLanguageLabel(language);
  const extension = CODE_FILE_EXTENSIONS[normalizedLanguage] ?? normalizedLanguage ?? 'txt';
  return `snippet.${extension}`;
};

const CodeBlockActionButton = memo(function CodeBlockActionButton({
  label,
  disabled = false,
  onClick,
  children,
}: CodeBlockActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${ACTION_BUTTON_CLASS}${disabled ? ` ${DISABLED_ACTION_BUTTON_CLASS}` : ''}`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
});

const PlainCodeBlock = memo(function PlainCodeBlock({
  code,
  wrapCodeBlocks,
}: {
  code: string;
  wrapCodeBlocks: boolean;
}) {
  return (
    <pre
      className={`code-block-plain-code m-0 bg-transparent p-4 text-[0.875rem] leading-7 ${
        wrapCodeBlocks ? 'w-full whitespace-pre-wrap break-words' : 'min-w-full w-max'
      }`}
      style={{
        fontFamily: CODE_FONT_FAMILY,
      }}
    >
      <code>{code}</code>
    </pre>
  );
});

const CodeBlockCardComponent = ({
  code,
  language,
  renderMode = 'rich',
  defaultCollapsed = false,
  wrapCodeBlocks = false,
}: CodeBlockCardProps) => {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const codeViewportRef = useRef<HTMLDivElement | null>(null);
  const { isCopied, copyText } = useTimedClipboardCopy({
    errorMessage: 'Failed to copy code block:',
  });
  const languageLabel = useMemo(() => getLanguageLabel(language), [language]);
  const hasOverflowLines = useMemo(() => code.includes('\n'), [code]);
  const isStreaming = renderMode === 'streaming';
  const isRichMode = renderMode === 'rich';
  const toggleLabel = isStreaming
    ? t('code.generatingPreview')
    : isExpanded
      ? t('code.collapseCode')
      : t('code.expandCode');

  useEffect(() => {
    if (isExpanded || !codeViewportRef.current) {
      return;
    }

    const viewport = codeViewportRef.current;
    const scrollToLatest = () => {
      viewport.scrollTop = viewport.scrollHeight;
    };

    scrollToLatest();

    if (isStreaming) {
      const frameId = window.requestAnimationFrame(scrollToLatest);
      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }
  }, [code, isExpanded, isStreaming]);

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a') as HTMLAnchorElement;
    link.href = objectUrl;
    link.download = getDownloadFileName(language);
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div
      className={`code-block-card my-4 block min-w-0 max-w-[min(42rem,100%)] overflow-hidden border ${
        wrapCodeBlocks ? 'w-full' : 'w-fit'
      }`}
    >
      <div className="code-block-card-header flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0 truncate text-[12px] font-semibold tracking-[0.02em]">
          {languageLabel}
        </div>
        <div className="flex items-center gap-1.5">
          {hasOverflowLines ? (
            <CodeBlockActionButton
              label={toggleLabel}
              disabled={isStreaming}
              onClick={() => {
                if (isStreaming) {
                  return;
                }
                setIsExpanded((value) => !value);
              }}
            >
              {toggleLabel}
            </CodeBlockActionButton>
          ) : null}
          <CodeBlockActionButton
            label={t('code.copyCode')}
            onClick={() => {
              void copyText(code);
            }}
          >
            {isCopied ? <CheckIcon size={14} strokeWidth={2} /> : <ContentCopyIcon size={14} />}
            {isCopied ? t('copy.copied') : t('code.copyCode')}
          </CodeBlockActionButton>
          <CodeBlockActionButton label={t('code.downloadCode')} onClick={handleDownload}>
            <DownloadIcon size={14} strokeWidth={2} />
            {t('code.downloadCode')}
          </CodeBlockActionButton>
        </div>
      </div>

      <div
        ref={codeViewportRef}
        className={
          isExpanded
            ? wrapCodeBlocks
              ? 'max-w-full overflow-x-hidden overflow-y-hidden'
              : 'max-w-full overflow-x-auto overflow-y-hidden'
            : wrapCodeBlocks
              ? 'max-h-[11rem] max-w-full overflow-y-auto overflow-x-hidden'
              : 'max-h-[11rem] max-w-full overflow-auto'
        }
      >
        {isRichMode ? (
          <CodeBlockSyntaxHighlighter
            code={code}
            language={languageLabel}
            wrapCodeBlocks={wrapCodeBlocks}
          />
        ) : (
          <PlainCodeBlock code={code} wrapCodeBlocks={wrapCodeBlocks} />
        )}
      </div>
    </div>
  );
};

const CodeBlockCard = memo(CodeBlockCardComponent);
export default CodeBlockCard;

