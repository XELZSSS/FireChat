import type { ProviderId } from '@contracts/chat';

export type RequestLogSourceKind = 'llm' | 'proxy';

export type RequestLogStatus = 'success' | 'error' | 'aborted';

export type RequestLogErrorType =
  | 'rate_limit'
  | 'auth'
  | 'network'
  | 'timeout'
  | 'server'
  | 'bad_request'
  | 'unknown'
  | null;

export type RequestLogRecord = {
  id: string;
  createdAt: number;
  sourceKind: RequestLogSourceKind;
  providerId: ProviderId | string;
  providerLabel: string;
  model?: string;
  sessionId?: string;
  status: RequestLogStatus;
  statusCode?: number;
  durationMs?: number;
  errorType: RequestLogErrorType;
  errorMessage?: string;
  upstreamRequestId?: string;
};

export type AppendRequestLogPayload = Omit<RequestLogRecord, 'id' | 'createdAt'> & {
  createdAt?: number;
};

export type RequestLogQuery = {
  providerId?: string;
  status?: RequestLogStatus;
  keyword?: string;
  limit?: number;
};

export type RequestLogQueryResult = {
  items: RequestLogRecord[];
  total: number;
};

export type ClearRequestLogsResult = {
  cleared: number;
};
