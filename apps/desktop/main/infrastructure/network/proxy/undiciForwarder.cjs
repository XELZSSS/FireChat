/* global Buffer */
const { Agent, request: undiciRequest } = require('undici');
const { PROXY_RESPONSE_HEADER_BLOCKLIST, toProxyRequestHeaders } = require('./proxyShared.cjs');

const upstreamAgent = new Agent({
  keepAliveTimeout: 10_000,
  keepAliveMaxTimeout: 30_000,
  connections: 24,
  pipelining: 1,
});

const writeUndiciResponse = async (request, response, upstreamResponse, corsHeaders) => {
  const headers = { ...corsHeaders };
  for (const [key, value] of Object.entries(upstreamResponse.headers)) {
    if (PROXY_RESPONSE_HEADER_BLOCKLIST.has(key.toLowerCase()) || value == null) {
      continue;
    }

    headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
  }

  response.writeHead(upstreamResponse.statusCode, headers);
  for await (const chunk of upstreamResponse.body) {
    response.write(chunk);
  }
  response.end();
};

const forwardViaUndici = async ({ request, response, target, payload, corsHeaders }) => {
  const body =
    typeof payload?.bodyBase64 === 'string' && payload.bodyBase64.length > 0
      ? Buffer.from(payload.bodyBase64, 'base64')
      : undefined;

  const upstreamStartedAt = Date.now();
  const upstreamResponse = await undiciRequest(target.url, {
    method: target.method,
    headers: toProxyRequestHeaders(payload?.headers),
    body,
    dispatcher: upstreamAgent,
    maxRedirections: 0,
    headersTimeout: 0,
    bodyTimeout: 0,
  });
  const upstreamRespondedAt = Date.now();

  await writeUndiciResponse(request, response, upstreamResponse, corsHeaders);

  return {
    upstreamDurationMs: upstreamRespondedAt - upstreamStartedAt,
    status: upstreamResponse.statusCode,
  };
};

module.exports = {
  forwardViaUndici,
};
