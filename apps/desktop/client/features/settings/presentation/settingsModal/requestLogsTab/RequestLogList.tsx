import { Field } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import type { RequestLogRecord } from '@contracts/request-log';
import { SettingsCard } from '@client/features/settings/presentation/settingsModal/sections/formParts';
import {
  SourceKindBadge,
  StatusBadge,
} from '@client/features/settings/presentation/settingsModal/requestLogsTab/badges';
import { formatRequestLogTimestamp } from '@client/features/settings/presentation/settingsModal/requestLogsTab/formatters';

type RequestLogListProps = {
  items: RequestLogRecord[];
  selectedLogId: string | null;
  isLoading: boolean;
  onSelectLog: (id: string) => void;
};

const REQUEST_LOG_GRID_CLASS = 'grid grid-cols-[1.1fr_0.85fr_0.75fr_0.7fr_0.7fr_1fr] gap-3';

const RequestLogList = ({ items, selectedLogId, isLoading, onSelectLog }: RequestLogListProps) => (
  <Field label={t('settings.requestLogs.list')}>
    <SettingsCard className="overflow-hidden p-0">
      <div
        className={`${REQUEST_LOG_GRID_CLASS} border-b border-[var(--line-1)] px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-[var(--ink-3)]`}
      >
        <div>{t('settings.requestLogs.column.provider')}</div>
        <div>{t('settings.requestLogs.column.type')}</div>
        <div>{t('settings.requestLogs.column.result')}</div>
        <div>{t('settings.requestLogs.column.code')}</div>
        <div>{t('settings.requestLogs.column.duration')}</div>
        <div>{t('settings.requestLogs.column.time')}</div>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-6 text-sm text-[var(--ink-3)]">
          {isLoading ? t('settings.requestLogs.loading') : t('settings.requestLogs.empty')}
        </div>
      ) : (
        <div className="max-h-[20rem] overflow-y-auto">
          {items.map((item) => {
            const isSelected = item.id === selectedLogId;

            return (
              <button
                key={item.id}
                type="button"
                className={`${REQUEST_LOG_GRID_CLASS} w-full border-b border-[var(--line-1)] px-4 py-3 text-left transition-colors ${
                  isSelected ? 'bg-[var(--bg-2)]' : 'hover:bg-[var(--bg-2)]/50'
                }`}
                onClick={() => onSelectLog(item.id)}
              >
                <div className="min-w-0">
                  <div className="truncate text-xs text-[var(--ink-1)]">{item.providerLabel}</div>
                  <div className="truncate text-[11px] text-[var(--ink-3)]">
                    {item.model || '-'}
                  </div>
                </div>
                <div className="flex items-center">
                  <SourceKindBadge sourceKind={item.sourceKind} />
                </div>
                <div className="flex items-center">
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex items-center text-xs text-[var(--ink-2)]">
                  {item.statusCode != null ? item.statusCode : '-'}
                </div>
                <div className="flex items-center text-xs text-[var(--ink-2)]">
                  {item.durationMs != null ? `${item.durationMs}ms` : '-'}
                </div>
                <div className="flex items-center text-xs text-[var(--ink-2)]">
                  {formatRequestLogTimestamp(item.createdAt)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </SettingsCard>
  </Field>
);

export default RequestLogList;
