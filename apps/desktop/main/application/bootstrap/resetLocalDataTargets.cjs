const fs = require('fs');
const path = require('path');

const isPathInsideDirectory = (directoryPath, targetPath) => {
  const relativePath = path.relative(directoryPath, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const normalizePathsInsideDirectory = (directoryPath, targetPaths) =>
  Array.from(
    new Set(
      targetPaths
        .filter(Boolean)
        .map((targetPath) => path.resolve(targetPath))
        .filter((targetPath) => isPathInsideDirectory(directoryPath, targetPath))
    )
  );

const normalizeNames = (values) =>
  new Set(
    values
      .filter((value) => typeof value === 'string')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );

const listDirectoryEntries = (directoryPath) => {
  try {
    return fs.readdirSync(directoryPath, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
};

const buildResetTargets = (userDataPath, preservedPaths, preservedEntryNames = []) => {
  const preservedPathSet = new Set(normalizePathsInsideDirectory(userDataPath, preservedPaths));
  const preservedEntryNameSet = normalizeNames(preservedEntryNames);

  return listDirectoryEntries(userDataPath)
    .filter((entry) => !preservedEntryNameSet.has(entry.name.trim().toLowerCase()))
    .map((entry) => path.resolve(path.join(userDataPath, entry.name)))
    .filter((targetPath) => !preservedPathSet.has(targetPath));
};

const resolveResetTargets = ({
  userDataPath,
  preservedPaths,
  preservedEntryNames,
  resetTargetPaths,
}) => {
  if (Array.isArray(resetTargetPaths) && resetTargetPaths.length > 0) {
    return normalizePathsInsideDirectory(userDataPath, resetTargetPaths);
  }

  return buildResetTargets(userDataPath, preservedPaths, preservedEntryNames);
};

const removeResetTarget = (targetPath) => {
  fs.rmSync(targetPath, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 150,
  });
};

module.exports = {
  removeResetTarget,
  resolveResetTargets,
};
