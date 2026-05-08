/* global Buffer */

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const PROXY_RESPONSE_HEADER_BLOCKLIST = new Set([
  'access-control-allow-origin',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-allow-credentials',
  'access-control-expose-headers',
  'access-control-max-age',
  'content-length',
]);

const isHeaderRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toProxyRequestHeaders = (headers) => {
  const normalizedHeaders = {};
  for (const [key, value] of Object.entries(isHeaderRecord(headers))) {
    if (typeof value !== 'string') {
      continue;
    }

    const normalizedKey = key.trim().toLowerCase();
    if (!normalizedKey || HOP_BY_HOP_HEADERS.has(normalizedKey)) {
      continue;
    }

    normalizedHeaders[normalizedKey] = value;
  }

  return normalizedHeaders;
};

const normalizeProxyMethod = (value) => {
  const normalizedMethod = typeof value === 'string' ? value.trim().toUpperCase() : 'GET';
  return normalizedMethod || 'GET';
};

const readRequestBody = (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.once('end', () => {
      resolve(Buffer.concat(chunks));
    });
    request.once('error', reject);
  });

const getCorsHeaders = (request) => {
  const requestOrigin = typeof request.headers.origin === 'string' ? request.headers.origin : '*';
  const requestedHeaders =
    typeof request.headers['access-control-request-headers'] === 'string'
      ? request.headers['access-control-request-headers']
      : 'content-type';

  return {
    'Access-Control-Allow-Origin': requestOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': requestedHeaders,
    'Access-Control-Max-Age': '600',
    Vary: 'Origin, Access-Control-Request-Headers',
  };
};

module.exports = {
  getCorsHeaders,
  normalizeProxyMethod,
  PROXY_RESPONSE_HEADER_BLOCKLIST,
  readRequestBody,
  toProxyRequestHeaders,
};
