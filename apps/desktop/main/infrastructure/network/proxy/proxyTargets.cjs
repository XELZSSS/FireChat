const { URL } = require('url');
const { normalizeProxyMethod } = require('./proxyShared.cjs');

const SUPPORTED_PROXY_TARGETS = {
  modal: {
    type: 'undici',
    allowedMethods: new Set(['GET', 'POST']),
    resolveUrl: (payload) => {
      const rawUrl = typeof payload?.url === 'string' ? payload.url.trim() : '';
      if (!rawUrl) {
        throw new Error('Modal proxy target is missing a URL.');
      }

      const resolvedUrl = new URL(rawUrl);
      const hostname = resolvedUrl.hostname.toLowerCase();
      const isAllowedHost =
        hostname === 'modal.run' ||
        hostname.endsWith('.modal.run') ||
        hostname.endsWith('.modal.direct');

      if (!isAllowedHost || resolvedUrl.protocol !== 'https:') {
        throw new Error('Modal proxy target must use an https Modal endpoint.');
      }

      resolvedUrl.username = '';
      resolvedUrl.password = '';
      resolvedUrl.hash = '';
      return resolvedUrl.toString();
    },
  },
  openadapter: {
    type: 'undici',
    allowedMethods: new Set(['GET', 'POST']),
    resolveUrl: (payload) => {
      const rawUrl = typeof payload?.url === 'string' ? payload.url.trim() : '';
      if (!rawUrl) {
        throw new Error('OpenAdapter proxy target is missing a URL.');
      }

      const resolvedUrl = new URL(rawUrl);
      if (resolvedUrl.origin !== 'https://api.openadapter.in') {
        throw new Error('OpenAdapter proxy target must use https://api.openadapter.in.');
      }

      resolvedUrl.username = '';
      resolvedUrl.password = '';
      resolvedUrl.hash = '';
      return resolvedUrl.toString();
    },
  },
  provider: {
    type: 'undici',
    allowedMethods: new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']),
    resolveUrl: (payload) => {
      const rawUrl = typeof payload?.url === 'string' ? payload.url.trim() : '';
      if (!rawUrl) {
        throw new Error('Provider proxy target is missing a URL.');
      }

      const resolvedUrl = new URL(rawUrl);
      if (!['http:', 'https:'].includes(resolvedUrl.protocol)) {
        throw new Error('Provider proxy target must use http or https.');
      }

      resolvedUrl.username = '';
      resolvedUrl.password = '';
      resolvedUrl.hash = '';
      return resolvedUrl.toString();
    },
  },
};

const resolveProxyTarget = (payload) => {
  const targetKey = typeof payload?.target === 'string' ? payload.target.trim() : '';
  const proxyTarget = SUPPORTED_PROXY_TARGETS[targetKey];
  if (!proxyTarget) {
    throw new Error(`Unsupported proxy target: ${targetKey || 'unknown'}.`);
  }

  const method = normalizeProxyMethod(payload?.method);
  if (!proxyTarget.allowedMethods.has(method)) {
    throw new Error(`Method ${method} is not allowed for proxy target ${targetKey}.`);
  }

  return {
    key: targetKey,
    type: proxyTarget.type,
    method,
    url: new URL(proxyTarget.resolveUrl(payload)),
  };
};

module.exports = {
  resolveProxyTarget,
};
