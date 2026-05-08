const httpProxy = require('http-proxy');
const { toProxyRequestHeaders } = require('./proxyShared.cjs');

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  xfwd: true,
  secure: true,
  proxyTimeout: 0,
  timeout: 0,
  ignorePath: true,
  prependPath: false,
  selfHandleResponse: false,
});

const forwardViaHttpProxy = ({ request, response, target, payload, corsHeaders }) =>
  new Promise((resolve, reject) => {
    const upstreamStartedAt = Date.now();
    let settled = false;
    const originalMethod = request.method;
    const originalUrl = request.url;

    const restoreRequest = () => {
      request.method = originalMethod;
      request.url = originalUrl;
    };

    const cleanup = () => {
      proxy.off('proxyRes', handleProxyRes);
      proxy.off('error', handleError);
      restoreRequest();
    };

    const settle = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback();
    };

    const handleProxyRes = (proxyRes, proxiedRequest, proxiedResponse) => {
      if (proxiedRequest !== request || proxiedResponse !== response) {
        return;
      }

      const duration = Date.now() - upstreamStartedAt;
      settle(() => {
        for (const [key, value] of Object.entries(corsHeaders)) {
          response.setHeader(key, value);
        }

        resolve({
          upstreamDurationMs: duration,
          status: proxyRes.statusCode ?? 200,
        });
      });
    };

    const handleError = (error, proxiedRequest, proxiedResponse) => {
      if (proxiedRequest !== request || proxiedResponse !== response) {
        return;
      }

      settle(() => {
        reject(error);
      });
    };

    proxy.on('proxyRes', handleProxyRes);
    proxy.on('error', handleError);
    request.method = target.method;
    request.url = `${target.url.pathname}${target.url.search}`;

    proxy.web(
      request,
      response,
      {
        target: target.url.toString(),
        ignorePath: true,
        headers: toProxyRequestHeaders(payload?.headers),
        selfHandleResponse: false,
      },
      (error) =>
        settle(() => {
          reject(error);
        })
    );
  });

module.exports = {
  forwardViaHttpProxy,
};
