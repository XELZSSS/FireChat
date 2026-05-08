const http = require('http');
const { getCorsHeaders, readRequestBody } = require('./proxy/proxyShared.cjs');
const { resolveProxyTarget } = require('./proxy/proxyTargets.cjs');
const { forwardViaUndici } = require('./proxy/undiciForwarder.cjs');
const { forwardViaHttpProxy } = require('./proxy/httpProxyForwarder.cjs');
const { forwardViaHttp2 } = require('./proxy/http2Forwarder.cjs');
const { HTTP_PROTOCOL_HTTP2, normalizeHttpProtocol } = require('./proxy/httpProtocol.cjs');
const { appendProxyRequestLog } = require('./proxy/proxyRequestLog.cjs');
const { writeProxyErrorResponse } = require('./proxy/proxyResponses.cjs');
const { createProxyLifecycleController } = require('./proxy/proxyLifecycle.cjs');

const PROXY_PATH = '/proxy';
const REQUEST_TIMEOUT_MS = 60_000;
const HEADERS_TIMEOUT_MS = 30_000;
const KEEP_ALIVE_TIMEOUT_MS = 5_000;

const forwardProxyRequest = ({ request, response, target, payload, corsHeaders }) => {
  const httpProtocol = normalizeHttpProtocol(payload?.httpProtocol);

  if (httpProtocol === HTTP_PROTOCOL_HTTP2) {
    return forwardViaHttp2({ request, response, target, payload, corsHeaders }).then((result) => ({
      ...result,
      transport: 'http2',
    }));
  }

  const forwarder = target.type === 'http-proxy'
    ? forwardViaHttpProxy({ request, response, target, payload, corsHeaders })
    : forwardViaUndici({ request, response, target, payload, corsHeaders });

  return forwarder.then((result) => ({
    ...result,
    transport: target.type,
  }));
};

const handleProxyRequest = async (request, response) => {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === 'OPTIONS' && request.url === PROXY_PATH) {
    response.writeHead(204, corsHeaders);
    response.end();
    return;
  }

  if (request.method !== 'POST' || request.url !== PROXY_PATH) {
    response.writeHead(404, {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify({ error: 'Not Found' }));
    return;
  }

  const requestStartedAt = Date.now();
  let payload = null;
  let target = null;

  try {
    const rawBody = await readRequestBody(request);
    payload = JSON.parse(rawBody.toString('utf8'));
    target = resolveProxyTarget(payload);
    const httpProtocol = normalizeHttpProtocol(payload?.httpProtocol);
    const result = await forwardProxyRequest({ request, response, target, payload, corsHeaders });

    const finishedAt = Date.now();
    appendProxyRequestLog({
      targetKey: target.key,
      model: typeof payload?.model === 'string' ? payload.model.trim() || undefined : undefined,
      durationMs: finishedAt - requestStartedAt,
      statusCode: result.status,
    });
    console.info(
      `[local-api-proxy] ${target.key} ${target.method} ${target.url.origin}${target.url.pathname} ` +
        `status=${result.status} upstream=${result.upstreamDurationMs}ms total=${finishedAt - requestStartedAt}ms transport=${result.transport} http=${httpProtocol}`
    );
  } catch (error) {
    appendProxyRequestLog({
      targetKey:
        target?.key ??
        (typeof payload?.target === 'string' && payload.target.trim()
          ? payload.target.trim()
          : 'proxy'),
      durationMs: Date.now() - requestStartedAt,
      model: typeof payload?.model === 'string' ? payload.model.trim() || undefined : undefined,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    writeProxyErrorResponse(response, corsHeaders, error);
  }
};

const createProxyServer = () => {
  const server = http.createServer((request, response) => {
    void handleProxyRequest(request, response);
  });
  server.requestTimeout = REQUEST_TIMEOUT_MS;
  server.headersTimeout = HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  return server;
};

const lifecycle = createProxyLifecycleController({
  createServer: createProxyServer,
});

module.exports = {
  getLocalApiProxyBaseUrl: lifecycle.getLocalApiProxyBaseUrl,
  readLocalApiProxyConfig: lifecycle.readLocalApiProxyConfig,
  restartLocalApiProxy: lifecycle.restartLocalApiProxy,
  syncLocalApiProxyConfig: lifecycle.syncLocalApiProxyConfig,
  startLocalApiProxy: lifecycle.startLocalApiProxy,
  stopLocalApiProxy: lifecycle.stopLocalApiProxy,
  updateLocalApiProxyConfig: lifecycle.updateLocalApiProxyConfig,
};
