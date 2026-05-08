const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { DatabaseSync } = require('node:sqlite');

const FIRECHAT_DATABASE_FILE_NAME = 'firechat.sqlite';

let database = null;

const getFireChatDatabasePath = () => path.join(app.getPath('userData'), FIRECHAT_DATABASE_FILE_NAME);

const getFireChatDatabasePaths = () => {
  const databasePath = getFireChatDatabasePath();
  return [databasePath, `${databasePath}-wal`, `${databasePath}-shm`];
};

const removeLegacyPersistentFiles = () => {
  for (const filePath of [path.join(app.getPath('userData'), 'request-logs.json')]) {
    fs.rmSync(filePath, { force: true });
  }
};

const initializeSchema = (db) => {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_storage (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      cli_session_ids TEXT,
      messages TEXT NOT NULL,
      search_text TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at
      ON chat_sessions(updated_at DESC);

    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      source_kind TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      provider_label TEXT NOT NULL,
      model TEXT,
      session_id TEXT,
      status TEXT NOT NULL,
      status_code INTEGER,
      duration_ms INTEGER,
      error_type TEXT,
      error_message TEXT,
      upstream_request_id TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_request_logs_created_at
      ON request_logs(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_request_logs_provider_status_created_at
      ON request_logs(provider_id, status, created_at DESC);
  `);
};

const getDatabase = () => {
  if (database) {
    return database;
  }

  const databasePath = getFireChatDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  removeLegacyPersistentFiles();
  database = new DatabaseSync(databasePath);
  initializeSchema(database);
  return database;
};

const closeFireChatDatabase = () => {
  if (!database) {
    return;
  }

  database.close();
  database = null;
};

module.exports = {
  closeFireChatDatabase,
  getDatabase,
  getFireChatDatabasePath,
  getFireChatDatabasePaths,
};
