const fs = require('fs');
const os = require('os');
const path = require('path');

const normalizeSessionId = (value) => String(value ?? '').trim();

const isPlainSessionFileId = (value) => /^[A-Za-z0-9._-]+$/.test(value) && !value.includes('..');

const isPathInsideDirectory = (parent, child) => {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const visitFiles = (rootDirectory, fileName, onFile) => {
  const resolvedRoot = path.resolve(rootDirectory);
  if (!fs.existsSync(resolvedRoot)) {
    return 0;
  }
  if (!fs.statSync(resolvedRoot).isDirectory()) {
    return 0;
  }

  let matchedFiles = 0;
  const visitDirectory = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visitDirectory(entryPath);
        continue;
      }
      if (!entry.isFile() || entry.name !== fileName) {
        continue;
      }

      const resolvedEntryPath = path.resolve(entryPath);
      if (!isPathInsideDirectory(resolvedRoot, resolvedEntryPath)) {
        throw new Error(`Refused to delete CLI session outside ${resolvedRoot}`);
      }
      onFile(resolvedEntryPath);
      matchedFiles += 1;
    }
  };

  visitDirectory(resolvedRoot);
  return matchedFiles;
};

const countNamedFilesUnderDirectory = (rootDirectory, fileName) =>
  visitFiles(rootDirectory, fileName, () => undefined);

const deleteNamedFilesUnderDirectory = (rootDirectory, fileName) =>
  visitFiles(rootDirectory, fileName, (entryPath) => {
    fs.rmSync(entryPath, { force: true });
  });

const getClaudeSessionRoots = () => {
  const claudeDirectory = path.join(os.homedir(), '.claude');
  return [path.join(claudeDirectory, 'projects'), path.join(claudeDirectory, 'sessions')];
};

const hasClaudeCodeCliSession = (sessionId, knownSessionIds) => {
  const normalizedSessionId = normalizeSessionId(sessionId);
  if (!normalizedSessionId || !isPlainSessionFileId(normalizedSessionId)) {
    return false;
  }

  const sessionFileName = `${normalizedSessionId}.jsonl`;
  return (
    knownSessionIds.has(normalizedSessionId) ||
    getClaudeSessionRoots().some(
      (rootDirectory) => countNamedFilesUnderDirectory(rootDirectory, sessionFileName) > 0
    )
  );
};

const deleteClaudeCodeCliSession = (sessionId, knownSessionIds) => {
  const normalizedSessionId = normalizeSessionId(sessionId);
  if (!normalizedSessionId) {
    return { ok: true, action: 'skipped', deletedFiles: 0 };
  }
  if (!isPlainSessionFileId(normalizedSessionId)) {
    return {
      ok: false,
      action: 'skipped',
      deletedFiles: 0,
      message: 'Claude Code CLI session id contains unsupported characters.',
    };
  }

  try {
    const sessionFileName = `${normalizedSessionId}.jsonl`;
    const deletedFiles = getClaudeSessionRoots().reduce(
      (count, rootDirectory) =>
        count + deleteNamedFilesUnderDirectory(rootDirectory, sessionFileName),
      0
    );
    knownSessionIds.delete(normalizedSessionId);

    return {
      ok: true,
      action: deletedFiles > 0 ? 'deleted' : 'skipped',
      deletedFiles,
    };
  } catch (error) {
    return {
      ok: false,
      action: 'skipped',
      deletedFiles: 0,
      message: error instanceof Error ? error.message : String(error),
    };
  }
};

module.exports = {
  deleteClaudeCodeCliSession,
  hasClaudeCodeCliSession,
  normalizeSessionId,
};
