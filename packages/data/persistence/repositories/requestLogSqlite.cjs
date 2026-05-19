const { getDatabase } = require('../schema/sqliteDatabase.cjs');
const { MAX_REQUEST_LOG_ITEMS } = require('./requestLogConstants.cjs');

const trimRequestLogs = () => {
  getDatabase()
    .prepare(
      `
        DELETE FROM request_logs
        WHERE id IN (
          SELECT id FROM request_logs
          ORDER BY created_at DESC
          LIMIT -1 OFFSET ?
        )
      `
    )
    .run(MAX_REQUEST_LOG_ITEMS);
};

const appendRequestLogRecord = (record) => {
  const db = getDatabase();
  db.prepare(
    `
      INSERT INTO request_logs (
        id,
        created_at,
        source_kind,
        provider_id,
        provider_label,
        model,
        session_id,
        status,
        status_code,
        duration_ms,
        error_type,
        error_message,
        upstream_request_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    record.id,
    record.createdAt,
    record.sourceKind,
    record.providerId,
    record.providerLabel,
    record.model ?? null,
    record.sessionId ?? null,
    record.status,
    record.statusCode ?? null,
    record.durationMs ?? null,
    record.errorType ?? null,
    record.errorMessage ?? null,
    record.upstreamRequestId ?? null
  );
  trimRequestLogs();
};

const rowToRequestLogRecord = (row) => ({
  id: row.id,
  createdAt: Number(row.createdAt),
  sourceKind: row.sourceKind,
  providerId: row.providerId,
  providerLabel: row.providerLabel,
  model: row.model ?? undefined,
  sessionId: row.sessionId ?? undefined,
  status: row.status,
  statusCode: row.statusCode ?? undefined,
  durationMs: row.durationMs ?? undefined,
  errorType: row.errorType ?? undefined,
  errorMessage: row.errorMessage ?? undefined,
  upstreamRequestId: row.upstreamRequestId ?? undefined,
});

const SELECT_REQUEST_LOG_COLUMNS = `
  SELECT
    id,
    created_at AS createdAt,
    source_kind AS sourceKind,
    provider_id AS providerId,
    provider_label AS providerLabel,
    model,
    session_id AS sessionId,
    status,
    status_code AS statusCode,
    duration_ms AS durationMs,
    error_type AS errorType,
    error_message AS errorMessage,
    upstream_request_id AS upstreamRequestId
  FROM request_logs
`;

const buildRequestLogQueryFilters = ({ providerId, status, keyword }) => {
  const filters = [];
  const params = [];

  if (providerId) {
    filters.push('provider_id = ?');
    params.push(providerId);
  }

  if (status) {
    filters.push('status = ?');
    params.push(status);
  }

  if (keyword) {
    filters.push(`
      (
        instr(lower(provider_id), ?) > 0 OR
        instr(lower(provider_label), ?) > 0 OR
        instr(lower(COALESCE(model, '')), ?) > 0 OR
        instr(lower(status), ?) > 0 OR
        instr(lower(COALESCE(error_type, '')), ?) > 0 OR
        instr(lower(COALESCE(error_message, '')), ?) > 0 OR
        instr(lower(COALESCE(upstream_request_id, '')), ?) > 0 OR
        instr(COALESCE(CAST(status_code AS TEXT), ''), ?) > 0
      )
    `);
    params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
  }

  return {
    whereClause: filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '',
    params,
  };
};

const listRequestLogRecords = () =>
  getDatabase()
    .prepare(
      `
        ${SELECT_REQUEST_LOG_COLUMNS}
        ORDER BY created_at DESC
        LIMIT ?
      `
    )
    .all(MAX_REQUEST_LOG_ITEMS)
    .map(rowToRequestLogRecord);

const queryRequestLogRecords = ({ providerId, status, keyword, limit }) => {
  const { whereClause, params } = buildRequestLogQueryFilters({
    providerId,
    status,
    keyword,
  });
  const db = getDatabase();
  const items = db
    .prepare(
      `
        ${SELECT_REQUEST_LOG_COLUMNS}
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ?
      `
    )
    .all(...params, limit)
    .map(rowToRequestLogRecord);
  const totalRow = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM request_logs
        ${whereClause}
      `
    )
    .get(...params);

  return {
    items,
    total: Number(totalRow?.count ?? 0),
  };
};

const clearRequestLogRecords = () => {
  const row = getDatabase().prepare('SELECT COUNT(*) AS count FROM request_logs').get();
  getDatabase().prepare('DELETE FROM request_logs').run();
  return Number(row?.count ?? 0);
};

module.exports = {
  appendRequestLogRecord,
  clearRequestLogRecords,
  listRequestLogRecords,
  queryRequestLogRecords,
};
