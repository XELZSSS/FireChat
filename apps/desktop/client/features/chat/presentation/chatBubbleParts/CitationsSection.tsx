import { memo, type ReactNode } from 'react';
import { t } from '@/shared/utils/i18n';
import type { Citation } from '@/shared/types/chat';
import { CITATION_CARD_CLASS } from '@client/features/chat/presentation/chatBubbleParts/constants';
import { TextContent } from '@client/features/chat/presentation/chatBubbleParts/TextContent';

type CitationCardProps = {
  header: ReactNode;
  snippet: string;
  sourcePath?: string;
  url?: string;
};

const CitationCard = memo(function CitationCard({
  header,
  snippet,
  sourcePath,
  url,
}: CitationCardProps) {
  return (
    <div className={CITATION_CARD_CLASS}>
      {header}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block break-all text-[11px] text-[var(--action-interactive)] underline"
        >
          {url}
        </a>
      ) : null}
      {sourcePath ? (
        <div className="mt-1 break-all text-[11px] text-[var(--ink-3)]">{sourcePath}</div>
      ) : null}
      <TextContent
        as="p"
        text={snippet}
        className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-6 text-[var(--ink-3)]"
      />
    </div>
  );
});

const formatCitationChunkLabel = (chunkIndex: number) =>
  `${t('chat.citations.chunk')} ${chunkIndex + 1}`;
const formatCitationScoreLabel = (score: number) =>
  `${t('chat.citations.score')} ${score.toFixed(3)}`;
const formatWebCitationLabel = (index: number, title?: string, url?: string) => {
  if (typeof title === 'string' && title.trim().length > 0) return title;
  if (typeof url === 'string' && url.trim().length > 0) return url;
  return `${t('chat.citations.webSource')} ${index + 1}`;
};

export const CitationsSection = memo(function CitationsSection({
  citations,
  areCitationsOpen,
  onToggle,
}: {
  citations: Citation[];
  areCitationsOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4 w-full max-w-[min(44rem,100%)] border border-[var(--line-1)] bg-[var(--bg-1)] px-3.5 py-3">
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 text-left text-[11px] font-medium tracking-[0.02em] text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
      >
        {t('chat.citations.title')}{' '}
        {areCitationsOpen ? t('reasoning.collapse') : t('reasoning.expand')}
      </button>
      {areCitationsOpen && (
        <div className="space-y-2">
          {citations.map((citation, index) => {
            const citationKey =
              citation.chunkId ?? citation.url ?? `${citation.sourceKind ?? 'local'}-${index}`;

            if (citation.sourceKind === 'web') {
              const label = formatWebCitationLabel(index, citation.title, citation.url);
              return (
                <CitationCard
                  key={citationKey}
                  header={
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--ink-2)]">
                      <span className="font-medium">{label}</span>
                      {typeof citation.score === 'number' && (
                        <span className="text-[10px] tracking-[0.02em] text-[var(--ink-3)]">
                          {formatCitationScoreLabel(citation.score)}
                        </span>
                      )}
                    </div>
                  }
                  url={citation.url}
                  snippet={citation.snippet}
                />
              );
            }

            return (
              <CitationCard
                key={citationKey}
                header={
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--ink-2)]">
                    <span className="font-medium">{citation.documentName}</span>
                    {typeof citation.chunkIndex === 'number' && (
                      <span className="text-[10px] tracking-[0.02em] text-[var(--ink-3)]">
                        {formatCitationChunkLabel(citation.chunkIndex)}
                      </span>
                    )}
                    {typeof citation.score === 'number' && (
                      <span className="text-[10px] tracking-[0.02em] text-[var(--ink-3)]">
                        {formatCitationScoreLabel(citation.score)}
                      </span>
                    )}
                  </div>
                }
                sourcePath={citation.sourcePath}
                snippet={citation.snippet}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
