import type { RequestLogErrorType } from './index';

export type FriendlyErrorType = 'auth' | 'quota' | 'safety' | 'network' | 'overloaded' | 'generic';

const REQUEST_LOG_MESSAGE_PATTERNS = {
  rateLimit: ['429', 'rate limit', 'too many requests', 'quota', 'insufficient_quota'],
  auth: ['401', '403', 'api key', 'unauthorized', 'forbidden', 'authentication'],
  timeout: ['timeout', 'timed out', 'headers timeout', 'body timeout'],
  network: ['fetch', 'network', 'econn', 'enotfound', 'socket'],
  safety: ['safety', 'blocked'],
  overloaded: ['503', 'overloaded'],
};

const includesAny = (value: string, patterns: string[]): boolean =>
  patterns.some((pattern) => value.includes(pattern));

const normalizeStatusCode = (statusCode?: number): number | undefined =>
  typeof statusCode === 'number' && Number.isFinite(statusCode) ? statusCode : undefined;

export const classifyRequestLogError = ({
  message = '',
  statusCode,
}: {
  message?: string;
  statusCode?: number;
} = {}): RequestLogErrorType => {
  const normalizedStatusCode = normalizeStatusCode(statusCode);
  const normalizedMessage = String(message).toLowerCase();

  if (normalizedStatusCode === 408 || normalizedStatusCode === 504) {
    return 'timeout';
  }

  if (normalizedStatusCode === 401 || normalizedStatusCode === 403) {
    return 'auth';
  }

  if (normalizedStatusCode === 429) {
    return 'rate_limit';
  }

  if (typeof normalizedStatusCode === 'number' && normalizedStatusCode >= 500) {
    return 'server';
  }

  if (typeof normalizedStatusCode === 'number' && normalizedStatusCode >= 400) {
    return 'bad_request';
  }

  if (includesAny(normalizedMessage, REQUEST_LOG_MESSAGE_PATTERNS.rateLimit)) {
    return 'rate_limit';
  }

  if (includesAny(normalizedMessage, REQUEST_LOG_MESSAGE_PATTERNS.auth)) {
    return 'auth';
  }

  if (includesAny(normalizedMessage, REQUEST_LOG_MESSAGE_PATTERNS.timeout)) {
    return 'timeout';
  }

  if (includesAny(normalizedMessage, REQUEST_LOG_MESSAGE_PATTERNS.network)) {
    return 'network';
  }

  return 'unknown';
};

export const classifyFriendlyError = ({
  message = '',
  statusCode,
}: {
  message?: string;
  statusCode?: number;
} = {}): FriendlyErrorType => {
  const normalizedStatusCode = normalizeStatusCode(statusCode);
  const normalizedMessage = String(message).toLowerCase();

  if (includesAny(normalizedMessage, REQUEST_LOG_MESSAGE_PATTERNS.safety)) {
    return 'safety';
  }

  if (
    normalizedStatusCode === 503 ||
    includesAny(normalizedMessage, REQUEST_LOG_MESSAGE_PATTERNS.overloaded)
  ) {
    return 'overloaded';
  }

  const logErrorType = classifyRequestLogError({
    message: normalizedMessage,
    statusCode: normalizedStatusCode,
  });

  if (logErrorType === 'auth') {
    return 'auth';
  }

  if (logErrorType === 'rate_limit') {
    return 'quota';
  }

  if (logErrorType === 'network') {
    return 'network';
  }

  return 'generic';
};
