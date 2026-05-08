const { net, protocol, session } = require('electron');

const OPENADAPTER_SCHEME = 'firechat-openadapter';
const OPENADAPTER_SCHEME_HOST = 'api';
const OPENADAPTER_API_ORIGIN = 'https://api.openadapter.in';

let schemeRegistered = false;
let handlerInstalled = false;

const filterRequestHeaders = (headers) => {
  const nextHeaders = new Headers(headers ?? {});
  for (const key of Array.from(nextHeaders.keys())) {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey === 'host' ||
      normalizedKey === 'connection' ||
      normalizedKey === 'content-length' ||
      normalizedKey === 'origin' ||
      normalizedKey === 'referer' ||
      normalizedKey === 'cookie' ||
      normalizedKey.startsWith('sec-fetch-')
    ) {
      nextHeaders.delete(key);
    }
  }

  return nextHeaders;
};

const resolveUpstreamUrl = (requestUrl) => {
  const url = new URL(requestUrl);
  if (url.protocol !== `${OPENADAPTER_SCHEME}:`) {
    throw new Error(`Unsupported OpenAdapter protocol: ${url.protocol}`);
  }

  if (url.hostname !== OPENADAPTER_SCHEME_HOST) {
    throw new Error(`Unsupported OpenAdapter protocol host: ${url.hostname}`);
  }

  return `${OPENADAPTER_API_ORIGIN}${url.pathname}${url.search}`;
};

const toRequestBodyBuffer = async (request) => {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return undefined;
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  return buffer.byteLength > 0 ? buffer : undefined;
};

const registerOpenAdapterScheme = () => {
  if (schemeRegistered) {
    return;
  }

  protocol.registerSchemesAsPrivileged([
    {
      scheme: OPENADAPTER_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);

  schemeRegistered = true;
};

const installOpenAdapterProtocolHandler = () => {
  if (handlerInstalled) {
    return;
  }

  session.defaultSession.protocol.handle(OPENADAPTER_SCHEME, async (request) => {
    const upstreamUrl = resolveUpstreamUrl(request.url);
    return net.fetch(upstreamUrl, {
      method: request.method,
      headers: filterRequestHeaders(request.headers),
      body: await toRequestBodyBuffer(request),
    });
  });

  handlerInstalled = true;
};

module.exports = {
  installOpenAdapterProtocolHandler,
  OPENADAPTER_API_ORIGIN,
  OPENADAPTER_SCHEME,
  OPENADAPTER_SCHEME_HOST,
  registerOpenAdapterScheme,
};
