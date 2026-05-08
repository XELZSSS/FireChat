const {
  closeFireChatDatabase,
  getFireChatDatabasePath,
  getFireChatDatabasePaths,
} = require('../schema/sqliteDatabase.cjs');
const {
  readAppStorage,
  removeAppStorage,
  writeAppStorage,
} = require('../repositories/appStorageSqlite.cjs');
const {
  deleteChatSession,
  getChatSession,
  getChatSessionSummaries,
  saveChatSession,
  searchChatSessionSummaries,
  updateChatSessionTitle,
} = require('../repositories/chatSessionSqlite.cjs');
const {
  appendRequestLogRecord,
  clearRequestLogRecords,
  listRequestLogRecords,
  queryRequestLogRecords,
} = require('../repositories/requestLogSqlite.cjs');

module.exports = {
  appendRequestLogRecord,
  clearRequestLogRecords,
  closeFireChatDatabase,
  deleteChatSession,
  getChatSession,
  getChatSessionSummaries,
  getFireChatDatabasePath,
  getFireChatDatabasePaths,
  listRequestLogRecords,
  queryRequestLogRecords,
  readAppStorage,
  removeAppStorage,
  saveChatSession,
  searchChatSessionSummaries,
  updateChatSessionTitle,
  writeAppStorage,
};
