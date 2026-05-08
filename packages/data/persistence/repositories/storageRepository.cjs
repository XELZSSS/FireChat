const requestLogStore = require('./requestLogStore.cjs');
const sqliteStore = require('../runtime/sqliteStore.cjs');

const createStorageRepository = () => ({
  appStorage: {
    read: sqliteStore.readAppStorage,
    write: sqliteStore.writeAppStorage,
    remove: sqliteStore.removeAppStorage,
  },
  chatSessions: {
    getSummaries: sqliteStore.getChatSessionSummaries,
    getSession: sqliteStore.getChatSession,
    saveSession: sqliteStore.saveChatSession,
    updateTitle: sqliteStore.updateChatSessionTitle,
    deleteSession: sqliteStore.deleteChatSession,
    searchSummaries: sqliteStore.searchChatSessionSummaries,
  },
  requestLogs: {
    append: requestLogStore.appendRequestLog,
    query: requestLogStore.queryRequestLogs,
    clear: requestLogStore.clearRequestLogs,
  },
  close: sqliteStore.closeFireChatDatabase,
});

module.exports = {
  createStorageRepository,
};
