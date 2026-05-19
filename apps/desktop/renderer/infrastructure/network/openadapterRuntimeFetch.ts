import { hasFireChatBridge } from '@client/features/desktop-shell/infrastructure/firechatBridge';
import { proxyFetch } from '@/infrastructure/network/proxyFetch';

export const OPENADAPTER_API_ORIGIN = 'https://api.openadapter.in';

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

const mergeRequestHeaders = (
  input: RequestInfo | URL,
  init?: RequestInit
): HeadersInit | undefined => {
  if (!isRequest(input)) {
    return init?.headers;
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

export const openadapterFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const url = getRequestUrl(input);
  if (!url.startsWith(OPENADAPTER_API_ORIGIN) || !hasFireChatBridge()) {
    return fetch(input, init);
  }

  return proxyFetch(
    {
      kind: 'openadapter',
      url,
    },
    {
      method: init?.method ?? (isRequest(input) ? input.method : 'GET'),
      headers: mergeRequestHeaders(input, init),
      body: await resolveRequestBody(input, init),
      signal: init?.signal ?? (isRequest(input) ? input.signal : undefined),
    }
  );
};
