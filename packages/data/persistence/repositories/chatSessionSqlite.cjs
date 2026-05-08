const { getDatabase } = require('../schema/sqliteDatabase.cjs');
const {
  normalizeLimit,
  normalizeNumber,
  normalizeOptionalLimit,
  normalizeOptionalString,
  normalizeRequiredString,
  parseJson,
} = require('../schema/sqliteNormalization.cjs');

const rowToChatSession = (row, includeMessages) => ({
  id: row.id,
  title: row.title,
  provider: row.provider,
  model: row.model,
  cliSessionIds: parseJson(row.cliSessionIds, undefined),
  messages: includeMessages ? parseJson(row.messages, []) : [],
  createdAt: Number(row.createdAt),
  updatedAt: Number(row.updatedAt),
});

const normalizeCliSessionIds = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const codex = normalizeOptionalString(value.codex);
  const claudeCode = normalizeOptionalString(value.claudeCode);
  const next = {
    ...(codex ? { codex } : {}),
    ...(claudeCode ? { claudeCode } : {}),
  };

  return Object.keys(next).length > 0 ? next : null;
};

const normalizeChatSessionPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('chat session payload must be an object.');
  }

  if (!Array.isArray(payload.messages)) {
    throw new Error('chat session messages must be an array.');
  }

  return {
    id: normalizeRequiredString(payload.id, 'session id'),
    title: normalizeRequiredString(payload.title, 'session title'),
    provider: normalizeRequiredString(payload.provider, 'session provider'),
    model: normalizeRequiredString(payload.model, 'session model'),
    cliSessionIds: normalizeCliSessionIds(payload.cliSessionIds),
    messages: payload.messages,
    searchText: typeof payload.searchText === 'string' ? payload.searchText.toLowerCase() : '',
    createdAt: normalizeNumber(payload.createdAt, 'session createdAt'),
    updatedAt: normalizeNumber(payload.updatedAt, 'session updatedAt'),
  };
};

const selectSessionColumns = `
  SELECT
    id,
    title,
    provider,
    model,
    cli_session_ids AS cliSessionIds,
    messages,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM chat_sessions
`;

const selectSessionSummaryColumns = `
  SELECT
    id,
    title,
    provider,
    model,
    cli_session_ids AS cliSessionIds,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM chat_sessions
`;

const getChatSessionSummaries = (limit) => {
  const maxRows = normalizeOptionalLimit(limit);
  const sql = `
    ${selectSessionSummaryColumns}
    ORDER BY updated_at DESC
    ${maxRows === null ? '' : 'LIMIT ?'}
  `;

  const statement = getDatabase().prepare(sql);
  const rows = maxRows === null ? statement.all() : statement.all(maxRows);
  return rows.map((row) => rowToChatSession(row, false));
};

const getChatSession = (sessionId) => {
  const id = normalizeRequiredString(sessionId, 'session id');
  const row = getDatabase()
    .prepare(
      `
        ${selectSessionColumns}
        WHERE id = ?
      `
    )
    .get(id);

  return row ? rowToChatSession(row, true) : null;
};

const saveChatSession = (payload) => {
  const session = normalizeChatSessionPayload(payload);
  getDatabase()
    .prepare(
      `
        INSERT INTO chat_sessions (
          id,
          title,
          provider,
          model,
          cli_session_ids,
          messages,
          search_text,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          provider = excluded.provider,
          model = excluded.model,
          cli_session_ids = excluded.cli_session_ids,
          messages = excluded.messages,
          search_text = excluded.search_text,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `
    )
    .run(
      session.id,
      session.title,
      session.provider,
      session.model,
      session.cliSessionIds ? JSON.stringify(session.cliSessionIds) : null,
      JSON.stringify(session.messages),
      session.searchText,
      session.createdAt,
      session.updatedAt
    );
};

const updateChatSessionTitle = ({ sessionId, title }) => {
  getDatabase()
    .prepare('UPDATE chat_sessions SET title = ? WHERE id = ?')
    .run(
      normalizeRequiredString(title, 'session title'),
      normalizeRequiredString(sessionId, 'session id')
    );
  return getChatSessionSummaries(200);
};

const deleteChatSession = (sessionId) => {
  getDatabase()
    .prepare('DELETE FROM chat_sessions WHERE id = ?')
    .run(normalizeRequiredString(sessionId, 'session id'));
  return getChatSessionSummaries(200);
};

const searchChatSessionSummaries = ({ query, limit }) => {
  const normalizedQuery = normalizeRequiredString(query, 'search query').toLowerCase();
  const maxRows = normalizeLimit(limit);
  return getDatabase()
    .prepare(
      `
        ${selectSessionSummaryColumns}
        WHERE instr(lower(title), ?) > 0 OR instr(search_text, ?) > 0
        ORDER BY updated_at DESC
        LIMIT ?
      `
    )
    .all(normalizedQuery, normalizedQuery, maxRows)
    .map((row) => rowToChatSession(row, false));
};

module.exports = {
  deleteChatSession,
  getChatSession,
  getChatSessionSummaries,
  saveChatSession,
  searchChatSessionSummaries,
  updateChatSessionTitle,
};
