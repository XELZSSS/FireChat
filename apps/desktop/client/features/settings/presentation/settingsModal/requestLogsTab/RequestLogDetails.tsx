import type { ReactNode } from 'react';
import { Field } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import type { RequestLogRecord } from '@contracts/request-log';
import { SettingsCard } from '@client/features/settings/presentation/settingsModal/sections/formParts';
import {
  StatusBadge,
  UpstreamStatusBadge,
} from '@client/features/settings/presentation/settingsModal/requestLogsTab/badges';
import {
  formatRequestLogTimestamp,
  getErrorTypeLabel,
  getSourceKindLabel,
} from '@client/features/settings/presentation/settingsModal/requestLogsTab/formatters';

type RequestLogDetailsProps = {
  selectedLog: RequestLogRecord | null;
};

const DETAIL_LABEL_CLASS = 'text-[11px] leading-5 text-[var(--ink-3)]';
const DETAIL_VALUE_CLASS = 'text-xs leading-5 text-[var(--ink-1)]';

const DetailItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="space-y-1">
    <dt className={DETAIL_LABEL_CLASS}>{label}</dt>
    <dd className={DETAIL_VALUE_CLASS}>{value}</dd>
  </div>
);

const RequestLogDetails = ({ selectedLog }: RequestLogDetailsProps) => {
  if (!selectedLog) {
    return null;
  }

  return (
    <Field label={t('settings.requestLogs.detailTitle')}>
      <SettingsCard>
        <dl className="grid gap-4 grid-cols-2">
          <DetailItem
            label={t('settings.requestLogs.column.provider')}
            value={selectedLog.providerLabel}
          />
          <DetailItem
            label={t('settings.requestLogs.column.type')}
            value={getSourceKindLabel(selectedLog.sourceKind)}
          />
          <DetailItem
            label={t('settings.requestLogs.column.result')}
            value={<StatusBadge status={selectedLog.status} />}
          />
          <DetailItem
            label={t('settings.requestLogs.column.code')}
            value={selectedLog.statusCode != null ? String(selectedLog.statusCode) : '-'}
          />
          <DetailItem
            label={t('settings.requestLogs.column.duration')}
            value={selectedLog.durationMs != null ? `${selectedLog.durationMs}ms` : '-'}
          />
          <DetailItem
            label={t('settings.requestLogs.column.time')}
            value={formatRequestLogTimestamp(selectedLog.createdAt)}
          />
          <DetailItem
            label={t('settings.requestLogs.detail.model')}
            value={selectedLog.model || '-'}
          />
          <DetailItem
            label={t('settings.requestLogs.detail.errorType')}
            value={getErrorTypeLabel(selectedLog.errorType)}
          />
          <DetailItem
            label={t('settings.requestLogs.detail.requestId')}
            value={selectedLog.upstreamRequestId || '-'}
          />
          <DetailItem
            label={t('settings.requestLogs.detail.upstreamStatus')}
            value={<UpstreamStatusBadge item={selectedLog} />}
          />
        </dl>
      </SettingsCard>
    </Field>
  );
};

export default RequestLogDetails;
