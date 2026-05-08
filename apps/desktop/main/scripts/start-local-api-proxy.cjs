const {
  getLocalApiProxyBaseUrl,
  startLocalApiProxy,
  stopLocalApiProxy,
} = require('../infrastructure/network/localApiProxy.cjs');

const run = async () => {
  await startLocalApiProxy();
  const proxyBaseUrl = getLocalApiProxyBaseUrl();
  console.info(`Standalone local API proxy listening at ${proxyBaseUrl}`);
};

const shutdown = async (signal) => {
  try {
    await stopLocalApiProxy();
    console.info(`Standalone local API proxy stopped after ${signal}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to stop standalone local API proxy:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

run().catch((error) => {
  console.error('Failed to start standalone local API proxy:', error);
  process.exit(1);
});
