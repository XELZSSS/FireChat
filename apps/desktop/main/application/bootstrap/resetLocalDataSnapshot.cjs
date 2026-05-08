const fs = require('fs');
const path = require('path');

const SKIPPABLE_SNAPSHOT_ERROR_CODES = new Set(['ENOENT', 'EBUSY', 'EPERM', 'EACCES', 'UNKNOWN']);

const isSkippableSnapshotError = (error) => SKIPPABLE_SNAPSHOT_ERROR_CODES.has(error?.code);

const createDirectorySnapshot = (directoryPath) => {
  const directories = [];
  const files = [];

  const walk = (currentPath) => {
    const entries = (() => {
      try {
        return fs.readdirSync(currentPath, { withFileTypes: true });
      } catch (error) {
        if (isSkippableSnapshotError(error)) {
          return [];
        }

        throw error;
      }
    })();

    try {
      if (entries.length === 0 && !fs.existsSync(currentPath)) {
        return;
      }
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(directoryPath, entryPath);

      if (entry.isDirectory()) {
        directories.push(relativePath);
        walk(entryPath);
        continue;
      }

      if (entry.isFile()) {
        try {
          files.push({
            relativePath,
            contents: fs.readFileSync(entryPath),
          });
        } catch (error) {
          if (isSkippableSnapshotError(error)) {
            continue;
          }

          throw error;
        }
      }
    }
  };

  walk(directoryPath);

  return {
    type: 'directory',
    targetPath: directoryPath,
    directories,
    files,
  };
};

const createResetTargetSnapshot = (targetPath) => {
  try {
    const stat = fs.lstatSync(targetPath);
    if (stat.isDirectory()) {
      return createDirectorySnapshot(targetPath);
    }

    if (stat.isFile()) {
      return {
        type: 'file',
        targetPath,
        contents: fs.readFileSync(targetPath),
      };
    }
  } catch (error) {
    if (isSkippableSnapshotError(error)) {
      return null;
    }
    throw error;
  }

  return null;
};

const restoreResetTargetSnapshot = (snapshot) => {
  if (!snapshot) {
    return;
  }

  if (snapshot.type === 'file') {
    try {
      fs.mkdirSync(path.dirname(snapshot.targetPath), { recursive: true });
      fs.writeFileSync(snapshot.targetPath, snapshot.contents);
    } catch (error) {
      if (isSkippableSnapshotError(error)) {
        return;
      }

      throw error;
    }
    return;
  }

  try {
    fs.mkdirSync(snapshot.targetPath, { recursive: true });
  } catch (error) {
    if (isSkippableSnapshotError(error)) {
      return;
    }

    throw error;
  }

  for (const directoryPath of snapshot.directories) {
    try {
      fs.mkdirSync(path.join(snapshot.targetPath, directoryPath), { recursive: true });
    } catch (error) {
      if (isSkippableSnapshotError(error)) {
        continue;
      }

      throw error;
    }
  }
  for (const fileEntry of snapshot.files) {
    const filePath = path.join(snapshot.targetPath, fileEntry.relativePath);
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, fileEntry.contents);
    } catch (error) {
      if (isSkippableSnapshotError(error)) {
        continue;
      }

      throw error;
    }
  }
};

module.exports = {
  createResetTargetSnapshot,
  restoreResetTargetSnapshot,
};
