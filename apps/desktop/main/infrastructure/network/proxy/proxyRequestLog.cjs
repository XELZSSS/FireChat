const { appendRequestLog } = require('../../../../../../packages/data/persistence/repositories/requestLogStore.cjs');
const {
  classifyRequestLogError,
} = require('../../../../../../packages/contracts/src/request-log/classification.cjs');

const PROXY_PROVIDER_LABELS = {
  modal: 'Modal',
  openadapter: 'OpenAdapter',
};

const MAX_PROXY_ERROR_MESSAGE_LENGTH = 240;

const truncateProxyErrorMessage = (value) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    return undefined;
  }

  return normalized.length > MAX_PROXY_ERROR_MESSAGE_LENGTH
    ? `${normalized.slice(0, MAX_PROXY_ERROR_MESSAGE_LENGTH)}...`
    : normalized;
};

const appendProxyRequestLog = ({ targetKey, model, durationMs, statusCode, errorMessage }) => {
  const status =
    typeof statusCode === 'number' && statusCode >= 200 && statusCode < 400 ? 'success' : 'error';
  const truncatedErrorMessage =
    status === 'error'
      ? truncateProxyErrorMessage(
          errorMessage ?? (statusCode != null ? `HTTP ${statusCode}` : undefined)
        )
      : undefined;

  try {
    appendRequestLog({
      sourceKind: 'proxy',
      providerId: targetKey,
      providerLabel: PROXY_PROVIDER_LABELS[targetKey] ?? targetKey,
      model,
      status,
      statusCode,
      durationMs,
      errorType:
        status === 'error'
          ? classifyRequestLogError({
              message: truncatedErrorMessage,
              statusCode,
            })
          : null,
      errorMessage: truncatedErrorMessage,
    });
  } catch (error) {
    console.error('Failed to append local proxy request log:', error);
  }
};

module.exports = {
  appendProxyRequestLog,
};

