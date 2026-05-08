import type { DropdownOption } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import type {
  RequestLogErrorType,
  RequestLogRecord,
  RequestLogStatus,
} from '@contracts/request-log';
import type { UpstreamStatusTone } from '@client/features/settings/presentation/settingsModal/requestLogsTab/types';

export const formatRequestLogTimestamp = (value: number): string =>
  new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value);

export const getSourceKindLabel = (value: RequestLogRecord['sourceKind']): string =>
  value === 'proxy' ? t('settings.requestLogs.kind.proxy') : t('settings.requestLogs.kind.llm');

export const getStatusLabel = (value: RequestLogStatus): string => {
  switch (value) {
    case 'success':
      return t('settings.requestLogs.statusValue.success');
    case 'aborted':
      return t('settings.requestLogs.statusValue.warning');
    case 'error':
    default:
      return t('settings.requestLogs.statusValue.failure');
  }
};

export const getErrorTypeLabel = (value: RequestLogErrorType): string => {
  switch (value) {
    case 'rate_limit':
      return t('settings.requestLogs.errorType.rateLimit');
    case 'auth':
      return t('settings.requestLogs.errorType.auth');
    case 'network':
      return t('settings.requestLogs.errorType.network');
    case 'timeout':
      return t('settings.requestLogs.errorType.timeout');
    case 'server':
      return t('settings.requestLogs.errorType.server');
    case 'bad_request':
      return t('settings.requestLogs.errorType.badRequest');
    case 'unknown':
      return t('settings.requestLogs.errorType.unknown');
    case null:
    default:
      return t('settings.requestLogs.errorType.none');
  }
};

export const resolveUpstreamStatusTone = (item: RequestLogRecord): UpstreamStatusTone => {
  if (item.status === 'success' && (item.statusCode == null || item.statusCode < 400)) {
    return 'normal';
  }

  if (
    item.status === 'aborted' ||
    item.errorType === 'rate_limit' ||
    item.errorType === 'timeout' ||
    item.errorType === 'network' ||
    item.statusCode === 408 ||
    item.statusCode === 429
  ) {
    return 'warning';
  }

  return 'error';
};

export const getUpstreamStatusLabel = (tone: UpstreamStatusTone): string => {
  switch (tone) {
    case 'normal':
      return t('settings.requestLogs.upstreamStatus.normal');
    case 'warning':
      return t('settings.requestLogs.upstreamStatus.warning');
    case 'error':
    default:
      return t('settings.requestLogs.upstreamStatus.error');
  }
};

export const buildProviderFilterOptions = (items: RequestLogRecord[]): DropdownOption[] => {
  const seen = new Set<string>();
  const options: DropdownOption[] = [
    { value: 'all', label: t('settings.requestLogs.provider.all') },
  ];

  for (const item of items) {
    if (seen.has(item.providerId)) {
      continue;
    }

    seen.add(item.providerId);
    options.push({
      value: item.providerId,
      label: item.providerLabel,
    });
  }

  return options;
};

export const buildResultFilterOptions = (): DropdownOption[] => [
  { value: 'all', label: t('settings.requestLogs.status.all') },
  { value: 'success', label: t('settings.requestLogs.result.success') },
  { value: 'error', label: t('settings.requestLogs.result.error') },
  { value: 'aborted', label: t('settings.requestLogs.result.aborted') },
];
