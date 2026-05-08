const LOOPBACK_HOST = '127.0.0.1';
const LOOPBACK_HOST_ALIASES = new Set(['127.0.0.1', 'localhost', '::1']);

const normalizeProxyHost = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  const normalizedHost = trimmed || LOOPBACK_HOST;
  if (!LOOPBACK_HOST_ALIASES.has(normalizedHost)) {
    throw new Error('Local proxy host must be one of: 127.0.0.1, localhost, ::1.');
  }

  return normalizedHost;
};

const normalizeProxyPort = (value) => {
  const trimmed =
    typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  if (!trimmed) {
    return 0;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error('Local proxy port must be an integer between 0 and 65535.');
  }

  return parsed;
};

const normalizeNextProxyConfig = ({ host, port }) => ({
  host: normalizeProxyHost(host),
  port: normalizeProxyPort(port),
});

const formatProxyBaseUrl = (config, address) => {
  const host = config.host === '::1' ? '[::1]' : config.host;
  return `http://${host}:${address.port}`;
};

const createProxyLifecycleController = ({ createServer }) => {
  let proxyServer = null;
  let proxyBaseUrl = null;
  let proxyStartupPromise = null;
  let proxyLifecyclePromise = Promise.resolve();
  let localApiProxyConfig = {
    host: LOOPBACK_HOST,
    port: 0,
  };

  const readLocalApiProxyConfig = () => ({ ...localApiProxyConfig });

  const getLocalApiProxyBaseUrl = () => {
    if (!proxyBaseUrl) {
      throw new Error('Local API proxy has not started.');
    }

    return proxyBaseUrl;
  };

  const hasProxyConfigChanged = (nextConfig) =>
    nextConfig.host !== localApiProxyConfig.host || nextConfig.port !== localApiProxyConfig.port;

  const runProxyLifecycleOperation = (operation) => {
    const nextOperation = proxyLifecyclePromise.catch(() => {}).then(operation);
    proxyLifecyclePromise = nextOperation.catch(() => {});
    return nextOperation;
  };

  const startLocalApiProxyUnsafe = async () => {
    if (proxyServer && proxyBaseUrl) {
      return proxyBaseUrl;
    }

    if (proxyStartupPromise) {
      return proxyStartupPromise;
    }

    proxyStartupPromise = (async () => {
      const config = readLocalApiProxyConfig();
      const server = createServer();
      proxyServer = server;

      try {
        await new Promise((resolve, reject) => {
          server.once('error', reject);
          server.listen(config.port, config.host, resolve);
        });

        const address = server.address();
        if (!address || typeof address === 'string') {
          throw new Error('Failed to resolve local API proxy address.');
        }

        proxyBaseUrl = formatProxyBaseUrl(config, address);
        console.info(`Local API proxy listening at ${proxyBaseUrl}`);
        return proxyBaseUrl;
      } catch (error) {
        try {
          server.close();
        } catch {
          // ignore close failure after listen error
        }
        proxyServer = null;
        proxyBaseUrl = null;
        throw error;
      } finally {
        proxyStartupPromise = null;
      }
    })();

    return proxyStartupPromise;
  };

  const stopLocalApiProxyUnsafe = async () => {
    if (!proxyServer) {
      return;
    }

    const server = proxyServer;
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    proxyServer = null;
    proxyBaseUrl = null;
    proxyStartupPromise = null;
  };

  const restartLocalApiProxyUnsafe = async () => {
    await stopLocalApiProxyUnsafe();
    return startLocalApiProxyUnsafe();
  };

  const applyLocalApiProxyConfigUnsafe = async ({ host, port, startIfStopped }) => {
    const nextConfig = normalizeNextProxyConfig({ host, port });
    const configChanged = hasProxyConfigChanged(nextConfig);
    localApiProxyConfig = nextConfig;

    if (proxyServer && configChanged) {
      const baseUrl = await restartLocalApiProxyUnsafe();
      return {
        ...nextConfig,
        baseUrl,
      };
    }

    if (startIfStopped && !proxyBaseUrl) {
      const baseUrl = await startLocalApiProxyUnsafe();
      return {
        ...nextConfig,
        baseUrl,
      };
    }

    return {
      ...nextConfig,
      ...(proxyBaseUrl ? { baseUrl: proxyBaseUrl } : {}),
    };
  };

  return {
    readLocalApiProxyConfig,
    getLocalApiProxyBaseUrl,
    startLocalApiProxy: () => runProxyLifecycleOperation(() => startLocalApiProxyUnsafe()),
    stopLocalApiProxy: () => runProxyLifecycleOperation(() => stopLocalApiProxyUnsafe()),
    restartLocalApiProxy: () => runProxyLifecycleOperation(() => restartLocalApiProxyUnsafe()),
    syncLocalApiProxyConfig: ({ host, port }) =>
      runProxyLifecycleOperation(() =>
        applyLocalApiProxyConfigUnsafe({
          host,
          port,
          startIfStopped: false,
        })
      ),
    updateLocalApiProxyConfig: ({ host, port }) =>
      runProxyLifecycleOperation(() =>
        applyLocalApiProxyConfigUnsafe({
          host,
          port,
          startIfStopped: true,
        })
      ),
  };
};

module.exports = {
  createProxyLifecycleController,
};
