const { IPC_CHANNELS } = require('../channels.cjs');
const { toRecord } = require('../systemHandlerHelpers.cjs');

const ACTIVE_SESSION_STORAGE_KEY = 'activeSessionId';

const buildStorageHandlers = ({ storageRepository }) => ({
  [IPC_CHANNELS.storage.readAppStorage]: (_event, key) => storageRepository.appStorage.read(key),
  [IPC_CHANNELS.storage.writeAppStorage]: (_event, payload) =>
    storageRepository.appStorage.write(toRecord(payload)),
  [IPC_CHANNELS.storage.removeAppStorage]: (_event, key) =>
    storageRepository.appStorage.remove(key),
  [IPC_CHANNELS.storage.getSessionSummaries]: async (_event, limit) =>
    storageRepository.chatSessions.getSummaries(limit),
  [IPC_CHANNELS.storage.getSession]: async (_event, sessionId) =>
    storageRepository.chatSessions.getSession(sessionId),
  [IPC_CHANNELS.storage.saveSession]: async (_event, payload) =>
    storageRepository.chatSessions.saveSession(toRecord(payload)),
  [IPC_CHANNELS.storage.updateSessionTitle]: async (_event, payload) =>
    storageRepository.chatSessions.updateTitle(toRecord(payload)),
  [IPC_CHANNELS.storage.deleteSession]: async (_event, sessionId) =>
    storageRepository.chatSessions.deleteSession(sessionId),
  [IPC_CHANNELS.storage.searchSessionSummaries]: async (_event, payload) =>
    storageRepository.chatSessions.searchSummaries(toRecord(payload)),
  [IPC_CHANNELS.storage.getActiveSessionId]: async () =>
    storageRepository.appStorage.read(ACTIVE_SESSION_STORAGE_KEY),
  [IPC_CHANNELS.storage.setActiveSessionId]: async (_event, sessionId) =>
    storageRepository.appStorage.write({
      key: ACTIVE_SESSION_STORAGE_KEY,
      value: String(sessionId ?? '').trim(),
    }),
  [IPC_CHANNELS.storage.clearActiveSessionId]: async () =>
    storageRepository.appStorage.remove(ACTIVE_SESSION_STORAGE_KEY),
});

module.exports = {
  buildStorageHandlers,
};
