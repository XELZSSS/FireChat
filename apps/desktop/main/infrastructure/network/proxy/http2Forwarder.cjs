/* global Buffer */
const http2 = require('http2');
const { PROXY_RESPONSE_HEADER_BLOCKLIST, toProxyRequestHeaders } = require('./proxyShared.cjs');

const { HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_HEADER_STATUS } = http2.constants;

const RESPONSE_HEADER_BLOCKLIST = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const toResponseHeaders = (headers, corsHeaders) => {
  const responseHeaders = { ...corsHeaders };

  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey.startsWith(':') ||
      RESPONSE_HEADER_BLOCKLIST.has(normalizedKey) ||
      PROXY_RESPONSE_HEADER_BLOCKLIST.has(normalizedKey)
    ) {
      continue;
    }

    responseHeaders[normalizedKey] = Array.isArray(value) ? value.join(', ') : String(value);
  }

  return responseHeaders;
};

const toRequestHeaders = (target, payload) => ({
  [HTTP2_HEADER_METHOD]: target.method,
  [HTTP2_HEADER_PATH]: `${target.url.pathname}${target.url.search}`,
  ...toProxyRequestHeaders(payload?.headers),
});

const forwardViaHttp2 = ({ response, target, payload, corsHeaders }) =>
  new Promise((resolve, reject) => {
    const body =
      typeof payload?.bodyBase64 === 'string' && payload.bodyBase64.length > 0
        ? Buffer.from(payload.bodyBase64, 'base64')
        : undefined;
    const upstreamStartedAt = Date.now();
    let upstreamRespondedAt = upstreamStartedAt;
    let status = 200;
    let settled = false;
    let stream = null;

    const session = http2.connect(target.url.origin);

    const cleanup = () => {
      if (stream) {
        stream.removeAllListeners();
      }
      session.removeAllListeners();
      session.close();
    };

    const settle = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback();
    };

    session.once('error', (error) => {
      settle(() => reject(error));
    });

    stream = session.request(toRequestHeaders(target, payload));

    stream.once('response', (headers) => {
      upstreamRespondedAt = Date.now();
      status = Number(headers[HTTP2_HEADER_STATUS]) || 200;
      response.writeHead(status, toResponseHeaders(headers, corsHeaders));
    });

    stream.on('data', (chunk) => {
      response.write(chunk);
    });

    stream.once('end', () => {
      response.end();
      settle(() =>
        resolve({
          upstreamDurationMs: upstreamRespondedAt - upstreamStartedAt,
          status,
        })
      );
    });

    stream.once('error', (error) => {
      settle(() => reject(error));
    });

    if (body) {
      stream.end(body);
    } else {
      stream.end();
    }
  });

module.exports = {
  forwardViaHttp2,
};
