import { getProviderUiMetaForId } from '@/infrastructure/providers/config/providerConfig';
import type { ProviderResponseMetadata } from '@/infrastructure/providers/types';
import { appendDesktopRequestLog } from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import type { ChatService } from '@client/features/chat/application/chatService';
import type { RequestLogErrorType, RequestLogStatus } from '@contracts/request-log';
import { classifyRequestLogError as classifySharedRequestLogError } from '@contracts/request-log/classification';
import { getErrorMessage } from '@client/features/chat/application/streaming/streamingMessageHelpers';
import { isPlainObject } from '@/shared/utils/plainObject';

const MAX_LOG_ERROR_MESSAGE_LENGTH = 240;

const truncateRequestLogMessage = (value: string | undefined): string | undefined => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    return undefined;
  }

  return normalized.length > MAX_LOG_ERROR_MESSAGE_LENGTH
    ? `${normalized.slice(0, MAX_LOG_ERROR_MESSAGE_LENGTH)}...`
    : normalized;
};

const readNumericProperty = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

export const extractStatusCode = (error: unknown): number | undefined => {
  if (!isPlainObject(error)) {
    return undefined;
  }

  const directStatusCode =
    readNumericProperty(error.statusCode) ?? readNumericProperty(error.status);
  if (directStatusCode != null) {
    return directStatusCode;
  }

  const response = isPlainObject(error.response) ? error.response : undefined;
  return response
    ? (readNumericProperty(response.statusCode) ?? readNumericProperty(response.status))
    : undefined;
};

const readHeaderValue = (headers: unknown, key: string): string | undefined => {
  if (headers instanceof Headers) {
    return headers.get(key) ?? undefined;
  }

  if (isPlainObject(headers)) {
    const direct = headers[key];
    if (typeof direct === 'string') {
      return direct;
    }

    const lower = headers[key.toLowerCase()];
    if (typeof lower === 'string') {
      return lower;
    }
  }

  return undefined;
};

export const extractUpstreamRequestId = (error: unknown): string | undefined => {
  if (!isPlainObject(error)) {
    return undefined;
  }

  const direct =
    (typeof error.requestId === 'string' && error.requestId.trim()) ||
    (typeof error._request_id === 'string' && error._request_id.trim());
  if (direct) {
    return direct;
  }

  const responseHeaders = isPlainObject(error.responseHeaders) ? error.responseHeaders : undefined;
  const requestIdFromHeaders = responseHeaders
    ? (readHeaderValue(responseHeaders, 'x-request-id') ??
      readHeaderValue(responseHeaders, 'request-id'))
    : undefined;
  if (requestIdFromHeaders) {
    return requestIdFromHeaders;
  }

  const response = isPlainObject(error.response) ? error.response : undefined;
  return response
    ? (readHeaderValue(response.headers, 'x-request-id') ??
        readHeaderValue(response.headers, 'request-id'))
    : undefined;
};

export const classifyRequestLogError = (
  rawMessage: string,
  statusCode?: number
): RequestLogErrorType => classifySharedRequestLogError({ message: rawMessage, statusCode });

export const appendChatRequestLog = ({
  chatService,
  requestStartedAt,
  status,
  error,
  responseMetadata,
}: {
  chatService: ChatService;
  requestStartedAt: number;
  status: RequestLogStatus;
  error?: unknown;
  responseMetadata?: ProviderResponseMetadata;
}): void => {
  const providerId = chatService.getProviderId();
  const providerLabel = getProviderUiMetaForId(providerId)?.label ?? providerId;
  const rawErrorMessage = error ? getErrorMessage(error) : '';
  const statusCode = responseMetadata?.statusCode ?? (error ? extractStatusCode(error) : undefined);
  const upstreamRequestId =
    responseMetadata?.upstreamRequestId ??
    responseMetadata?.responseId ??
    (error ? extractUpstreamRequestId(error) : undefined);

  void appendDesktopRequestLog({
    sourceKind: 'llm',
    providerId,
    providerLabel,
    model: chatService.getModelName(),
    status,
    statusCode,
    durationMs: Math.round(performance.now() - requestStartedAt),
    errorType: status === 'error' ? classifyRequestLogError(rawErrorMessage, statusCode) : null,
    errorMessage: status === 'error' ? truncateRequestLogMessage(rawErrorMessage) : undefined,
    upstreamRequestId,
  }).catch((loggingError) => {
    console.error('Failed to append chat request log:', loggingError);
  });
};
