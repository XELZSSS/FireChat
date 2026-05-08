import type { RequestLogStatus } from '@contracts/request-log';

export type RequestLogsTabProps = {
  mutationsLockedReason?: string | null;
};

export type RequestLogStatusFilter = 'all' | RequestLogStatus;
export type UpstreamStatusTone = 'normal' | 'warning' | 'error';
