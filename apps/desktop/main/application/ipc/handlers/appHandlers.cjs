/* global process */
const { app, shell } = require('electron');
const path = require('path');
const { parseExternalHttpUrl, shouldOpenExternalUrl } = require('../../../../../shared/external-url.cjs');
const { IPC_CHANNELS } = require('../channels.cjs');
const {
  exportOptionsConfig,
  importOptionsConfig,
  runLocalDataReset,
  toRecord,
} = require('../systemHandlerHelpers.cjs');
const { ensureFireChatLocalConfigFile } = require('../../../infrastructure/config/localConfig.cjs');
const {
  readInterfaceLayoutConfig,
  writeInterfaceLayoutConfig,
} = require('../../../infrastructure/config/interfaceLayoutConfig.cjs');
const {
  readProviderConfigSnapshot,
  writeProviderConfigSnapshot,
} = require('../../../infrastructure/config/providerConfig.cjs');
const {
  getLocalApiProxyBaseUrl,
  readLocalApiProxyConfig,
  syncLocalApiProxyConfig,
  startLocalApiProxy,
  updateLocalApiProxyConfig,
} = require('../../../infrastructure/network/localApiProxy.cjs');
const { writeStartupAppearance } = require('../../../infrastructure/electron/startupAppearance.cjs');
const { applyWindowAppearance } = require('../../../infrastructure/electron/appWindow.cjs');
const { writeWindowBehavior } = require('../../../infrastructure/electron/windowBehavior.cjs');
const {
  cleanupCliSessions,
  getCliProviderStatus,
  runCliPrompt,
  stopCliProvider,
  syncCliProviderConfig,
} = require('../../../infrastructure/cli/cliProcessManager.cjs');

const openExternalUrl = async (url) => {
  const target = String(url ?? '').trim();
  if (!target) return;
  if (!shouldOpenExternalUrl(target, !app.isPackaged, process.env.VITE_DEV_SERVER_URL)) {
    throw new Error(
      'Blocked external URL: only http/https URLs outside the app origin are allowed'
    );
  }

  const parsed = parseExternalHttpUrl(target);
  await shell.openExternal(parsed.toString());
};

const buildAppConfigHandlers = () => ({
  [IPC_CHANNELS.app.openLocalConfig]: async () => {
    const configPath = ensureFireChatLocalConfigFile();
    await shell.openPath(configPath);
  },
  [IPC_CHANNELS.app.openConfigDirectory]: async () => {
    const configPath = ensureFireChatLocalConfigFile();
    await shell.openPath(path.dirname(configPath));
  },
  [IPC_CHANNELS.app.exportOptionsConfig]: async (_event, payload) => exportOptionsConfig(payload),
  [IPC_CHANNELS.app.importOptionsConfig]: async () => importOptionsConfig(),
  [IPC_CHANNELS.app.getInterfaceLayoutConfig]: async () => readInterfaceLayoutConfig(),
  [IPC_CHANNELS.app.saveInterfaceLayoutConfig]: async (_event, payload) =>
    writeInterfaceLayoutConfig(payload),
  [IPC_CHANNELS.app.getProviderConfigSnapshot]: async () => readProviderConfigSnapshot(),
  [IPC_CHANNELS.app.saveProviderConfigSnapshot]: async (_event, payload) =>
    writeProviderConfigSnapshot(payload),
});

const buildAppNetworkHandlers = () => ({
  [IPC_CHANNELS.app.getLocalProxyBaseUrl]: async () => {
    await startLocalApiProxy();
    return getLocalApiProxyBaseUrl();
  },
  [IPC_CHANNELS.app.getLocalProxyConfig]: async () => {
    await startLocalApiProxy();
    return {
      ...readLocalApiProxyConfig(),
      baseUrl: getLocalApiProxyBaseUrl(),
    };
  },
  [IPC_CHANNELS.app.syncLocalProxyConfig]: async (_event, payload) => {
    const record = toRecord(payload);
    return syncLocalApiProxyConfig({
      host: record.host,
      port: record.port,
    });
  },
  [IPC_CHANNELS.app.updateLocalProxyConfig]: async (_event, payload) => {
    const record = toRecord(payload);
    return updateLocalApiProxyConfig({
      host: record.host,
      port: record.port,
    });
  },
});

const buildAppHandlers = ({
  storageRepository,
  prepareForResetLocalData,
  clearPersistedLocalData,
  recoverFromFailedLocalDataReset,
  finalizeLocalDataReset,
}) => ({
  [IPC_CHANNELS.app.openExternal]: async (_event, url) => openExternalUrl(url),
  ...buildAppConfigHandlers(),
  [IPC_CHANNELS.app.parseAttachment]: async (_event, payload) => {
    const {
      parseAttachmentBuffer,
    } = require('../../../infrastructure/network/documentAttachmentParser.cjs');
    const record = toRecord(payload);
    return parseAttachmentBuffer({
      fileName: record.fileName,
      mimeType: record.mimeType,
      bytes: record.bytes,
      pageRange: record.pageRange,
    });
  },
  [IPC_CHANNELS.app.resetLocalData]: async () => {
    storageRepository.close();
    return runLocalDataReset({
      prepareForResetLocalData,
      clearPersistedLocalData,
      recoverFromFailedLocalDataReset,
      finalizeLocalDataReset,
    });
  },
  ...buildAppNetworkHandlers(),
  [IPC_CHANNELS.app.updateWindowBehavior]: async (_event, payload) =>
    writeWindowBehavior(toRecord(payload)),
  [IPC_CHANNELS.app.getCliProviderStatus]: async () => getCliProviderStatus(),
  [IPC_CHANNELS.app.syncCliProviderConfig]: async (_event, payload) =>
    syncCliProviderConfig(toRecord(payload)),
  [IPC_CHANNELS.app.runCliPrompt]: async (_event, payload) => runCliPrompt(toRecord(payload)),
  [IPC_CHANNELS.app.stopCliProvider]: async (_event, provider) => stopCliProvider(provider),
  [IPC_CHANNELS.app.cleanupCliSessions]: async (_event, payload) =>
    cleanupCliSessions(toRecord(payload)),
  [IPC_CHANNELS.app.appendRequestLog]: async (_event, payload) =>
    storageRepository.requestLogs.append(toRecord(payload)),
  [IPC_CHANNELS.app.queryRequestLogs]: async (_event, payload) =>
    storageRepository.requestLogs.query(toRecord(payload)),
  [IPC_CHANNELS.app.clearRequestLogs]: async () => storageRepository.requestLogs.clear(),
  [IPC_CHANNELS.app.updateStartupAppearance]: async (_event, payload) => {
    const appearance = writeStartupAppearance(toRecord(payload));
    applyWindowAppearance(appearance);
    return appearance;
  },
});

module.exports = {
  buildAppHandlers,
};
