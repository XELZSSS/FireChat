import {
  getBridgeNamespace,
  hasFireChatBridge,
} from '@client/features/desktop-shell/infrastructure/firechatBridge';
import { loadAppSettings } from '@/infrastructure/persistence/appSettingsStore';

let proxyBaseUrlPromise: Promise<string> | null = null;
let proxyBaseUrl: string | null = null;

export type ProxyFetchTarget =
  | { kind: 'modal'; url: string }
  | { kind: 'openadapter'; url: string }
  | { kind: 'provider'; url: string };

const isProxyFetchTarget = (
  value: RequestInfo | URL | ProxyFetchTarget
): value is ProxyFetchTarget => typeof value === 'object' && value !== null && 'kind' in value;

const getLocalProxyBaseUrl = (): Promise<string> => {
  if (!hasFireChatBridge()) {
    throw new Error('Local API proxy is unavailable outside the desktop runtime.');
  }

  if (proxyBaseUrl) {
    return Promise.resolve(proxyBaseUrl);
  }

  if (!proxyBaseUrlPromise) {
    proxyBaseUrlPromise = getBridgeNamespace('app')
      .getLocalProxyBaseUrl()
      .then((baseUrl) => {
        proxyBaseUrl = baseUrl;
        return baseUrl;
      })
      .catch((error) => {
        proxyBaseUrlPromise = null;
        throw error;
      });
  }

  return proxyBaseUrlPromise;
};

export const setCachedLocalProxyBaseUrl = (baseUrl: string | null): void => {
  proxyBaseUrl = baseUrl;
  proxyBaseUrlPromise = baseUrl ? Promise.resolve(baseUrl) : null;
};

const toProxyHeaders = (headersInit?: HeadersInit): Record<string, string> => {
  const headers = new Headers(headersInit ?? {});
  const normalizedHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    normalizedHeaders[key] = value;
  });
  return normalizedHeaders;
};

const toBodyBase64 = async (body?: BodyInit | null): Promise<string | undefined> => {
  if (body == null) {
    return undefined;
  }

  if (typeof body === 'string') {
    return toTextBase64(body);
  }

  if (body instanceof URLSearchParams) {
    return toTextBase64(body.toString());
  }

  if (body instanceof Blob) {
    const buffer = await body.arrayBuffer();
    return toArrayBufferBase64(buffer);
  }

  if (body instanceof ArrayBuffer) {
    return toArrayBufferBase64(body);
  }

  if (ArrayBuffer.isView(body)) {
    return toArrayBufferBase64(
      body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)
    );
  }

  throw new Error('Unsupported proxied request body type.');
};

const toTextBase64 = (value: string): string => {
  return toArrayBufferBase64(new TextEncoder().encode(value).buffer);
};

const toArrayBufferBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const toProxyRequestPayload = async (
  target: ProxyFetchTarget,
  init?: RequestInit
): Promise<Record<string, unknown>> => {
  const bodyBase64 = await toBodyBase64(init?.body);
  const httpProtocol = loadAppSettings().httpProtocol;

  return {
    target: target.kind,
    url: target.url,
    method: init?.method ?? 'GET',
    headers: toProxyHeaders(init?.headers),
    bodyBase64,
    httpProtocol,
  };
};

const isRequest = (input: RequestInfo | URL): input is Request =>
  typeof Request !== 'undefined' && input instanceof Request;

const getRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

const mergeRequestHeaders = (input: RequestInfo | URL, init?: RequestInit): HeadersInit => {
  if (!isRequest(input)) {
    return init?.headers ?? {};
  }

  const headers = new Headers(input.headers);
  const overrideHeaders = new Headers(init?.headers);
  overrideHeaders.forEach((value, key) => {
    headers.set(key, value);
  });
  return headers;
};

const resolveRequestBody = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<BodyInit | undefined> => {
  if (init?.body != null) {
    return init.body;
  }

  if (!isRequest(input) || input.method === 'GET' || input.method === 'HEAD') {
    return undefined;
  }

  return await input.clone().arrayBuffer();
};

const toProviderRequestInit = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<RequestInit> => ({
  method: init?.method ?? (isRequest(input) ? input.method : 'GET'),
  headers: mergeRequestHeaders(input, init),
  body: await resolveRequestBody(input, init),
  signal: init?.signal ?? (isRequest(input) ? input.signal : undefined),
});

export const providerHttpFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const url = getRequestUrl(input);
  return proxyFetch({ kind: 'provider', url }, await toProviderRequestInit(input, init));
};

export const proxyFetch = async (
  target: RequestInfo | URL | ProxyFetchTarget,
  init?: RequestInit
): Promise<Response> => {
  if (!isProxyFetchTarget(target)) {
    return fetch(target, init);
  }

  const proxyBaseUrl = await getLocalProxyBaseUrl();
  const payload = await toProxyRequestPayload(target, init);

  return fetch(`${proxyBaseUrl}/proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: init?.signal,
  });
};
