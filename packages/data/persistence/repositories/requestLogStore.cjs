const { randomUUID } = require('crypto');
const {
  appendRequestLogRecord,
  clearRequestLogRecords,
  queryRequestLogRecords,
} = require('../runtime/sqliteStore.cjs');

const MAX_REQUEST_LOG_ITEMS = 500;
const DEFAULT_QUERY_LIMIT = 200;
const MAX_ERROR_MESSAGE_LENGTH = 240;

const REQUEST_LOG_STATUSES = new Set(['success', 'error', 'aborted']);
const REQUEST_LOG_SOURCE_KINDS = new Set(['llm', 'proxy']);
const REQUEST_LOG_ERROR_TYPES = new Set([
  'rate_limit',
  'auth',
  'network',
  'timeout',
  'server',
  'bad_request',
  'unknown',
]);

const normalizeString = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

const normalizeStatus = (value) => (REQUEST_LOG_STATUSES.has(value) ? value : 'error');

const normalizeSourceKind = (value) => (REQUEST_LOG_SOURCE_KINDS.has(value) ? value : 'llm');

const normalizeErrorType = (value) =>
  value == null ? null : REQUEST_LOG_ERROR_TYPES.has(value) ? value : 'unknown';

const normalizeOptionalNumber = (value) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const truncateErrorMessage = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) {
    return undefined;
  }

  return normalized.length > MAX_ERROR_MESSAGE_LENGTH
    ? `${normalized.slice(0, MAX_ERROR_MESSAGE_LENGTH)}...`
    : normalized;
};

const normalizeRequestLogRecord = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const createdAt = normalizeOptionalNumber(value.createdAt) ?? Date.now();
  const providerId = normalizeString(value.providerId) ?? 'unknown';

  return {
    id: normalizeString(value.id) ?? randomUUID(),
    createdAt,
    sourceKind: normalizeSourceKind(value.sourceKind),
    providerId,
    providerLabel: normalizeString(value.providerLabel) ?? providerId,
    model: normalizeString(value.model),
    sessionId: normalizeString(value.sessionId),
    status: normalizeStatus(value.status),
    statusCode: normalizeOptionalNumber(value.statusCode),
    durationMs: normalizeOptionalNumber(value.durationMs),
    errorType: normalizeErrorType(value.errorType),
    errorMessage: truncateErrorMessage(value.errorMessage),
    upstreamRequestId: normalizeString(value.upstreamRequestId),
  };
};

const appendRequestLog = (payload) => {
  const nextItem = normalizeRequestLogRecord(payload);
  if (!nextItem) {
    throw new Error('Request log payload must be an object.');
  }

  appendRequestLogRecord(nextItem);
  return nextItem;
};

const normalizeQueryLimit = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_QUERY_LIMIT;
  }

  return Math.max(1, Math.min(MAX_REQUEST_LOG_ITEMS, Math.trunc(value)));
};

const queryRequestLogs = (query = {}) => {
  const providerId = normalizeString(query.providerId);
  const status = REQUEST_LOG_STATUSES.has(query.status) ? query.status : undefined;
  const keyword = normalizeString(query.keyword)?.toLowerCase();
  const limit = normalizeQueryLimit(query.limit);

  return queryRequestLogRecords({
    providerId,
    status,
    keyword,
    limit,
  });
};

const clearRequestLogs = () => {
  return {
    cleared: clearRequestLogRecords(),
  };
};

module.exports = {
  appendRequestLog,
  clearRequestLogs,
  queryRequestLogs,
};
