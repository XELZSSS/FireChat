const fs = require('fs');
const path = require('path');

const ARTIFACT_EXTENSIONS = new Set([
  '.exe',
  '.blockmap',
  '.zip',
  '.7z',
  '.msi',
  '.nupkg',
  '.dmg',
  '.pkg',
  '.appimage',
  '.deb',
  '.rpm',
  '.snap',
]);

const VERSION_PATTERN = /\b\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?\b/;

const rootDir = path.resolve(__dirname, '..', '..', '..', '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const releaseDir = path.resolve(
  rootDir,
  process.env.FIRECHAT_RELEASE_DIR ?? packageJson.build?.directories?.output ?? 'release'
);
const currentVersion = String(packageJson.version ?? '').trim();

const isArtifactFile = (fileName) => {
  const lowerFileName = fileName.toLowerCase();
  return Array.from(ARTIFACT_EXTENSIONS).some((extension) => lowerFileName.endsWith(extension));
};

const getArtifactVersion = (fileName) => {
  const match = fileName.match(VERSION_PATTERN);
  return match ? match[0] : null;
};

const cleanupOldArtifacts = () => {
  if (!currentVersion) {
    throw new Error('Missing package version.');
  }

  if (!fs.existsSync(releaseDir)) {
    console.info(`[cleanup-release] Skip: release directory not found: ${releaseDir}`);
    return;
  }

  const removedFiles = [];

  for (const entry of fs.readdirSync(releaseDir, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }

    if (!isArtifactFile(entry.name)) {
      continue;
    }

    const artifactVersion = getArtifactVersion(entry.name);
    if (!artifactVersion || artifactVersion === currentVersion) {
      continue;
    }

    const targetPath = path.join(releaseDir, entry.name);
    fs.rmSync(targetPath, { force: true });
    removedFiles.push(entry.name);
  }

  if (removedFiles.length === 0) {
    console.info(`[cleanup-release] No old artifacts to remove in ${releaseDir}`);
    return;
  }

  console.info(
    `[cleanup-release] Removed ${removedFiles.length} old artifact(s): ${removedFiles.join(', ')}`
  );
};

cleanupOldArtifacts();
