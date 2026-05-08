import type { CSSProperties } from 'react';
import type { RequestLogRecord, RequestLogStatus } from '@contracts/request-log';
import {
  getSourceKindLabel,
  getStatusLabel,
  getUpstreamStatusLabel,
  resolveUpstreamStatusTone,
} from '@client/features/settings/presentation/settingsModal/requestLogsTab/formatters';
import type { UpstreamStatusTone } from '@client/features/settings/presentation/settingsModal/requestLogsTab/types';

const TONE_BADGE_STYLE = {
  normal: {
    color: '#4ade80',
    borderColor: 'rgba(74, 222, 128, 0.55)',
    backgroundColor: 'rgba(74, 222, 128, 0.14)',
  },
  warning: {
    color: '#fbbf24',
    borderColor: 'rgba(251, 191, 36, 0.55)',
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
  },
  error: {
    color: '#f87171',
    borderColor: 'rgba(248, 113, 113, 0.55)',
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
  },
} as const satisfies Record<UpstreamStatusTone, CSSProperties>;

const STATUS_BADGE_TONE: Record<RequestLogStatus, UpstreamStatusTone> = {
  success: 'normal',
  error: 'error',
  aborted: 'warning',
};

const TYPE_BADGE_CLASS = {
  llm: 'border-[var(--line-1)] text-[var(--ink-2)]',
  proxy: 'border-[var(--line-1)] text-[var(--ink-2)]',
} as const;

export const SourceKindBadge = ({ sourceKind }: { sourceKind: RequestLogRecord['sourceKind'] }) => (
  <span className={`inline-flex border px-2 py-1 text-[11px] ${TYPE_BADGE_CLASS[sourceKind]}`}>
    {getSourceKindLabel(sourceKind)}
  </span>
);

export const StatusBadge = ({ status }: { status: RequestLogStatus }) => (
  <span
    className="inline-flex border px-2 py-1 text-xs"
    style={TONE_BADGE_STYLE[STATUS_BADGE_TONE[status]]}
  >
    {getStatusLabel(status)}
  </span>
);

export const UpstreamStatusBadge = ({ item }: { item: RequestLogRecord }) => {
  const tone = resolveUpstreamStatusTone(item);

  return (
    <span className="inline-flex border px-2 py-1 text-xs" style={TONE_BADGE_STYLE[tone]}>
      {getUpstreamStatusLabel(tone)}
    </span>
  );
};
