const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..', '..', '..', '..');

const WINDOWS_REQUIRED_PATH_ENTRIES = [
  'C:\\Windows\\System32',
  'C:\\Windows',
  'C:\\Windows\\System32\\Wbem',
  'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\',
  'C:\\Program Files\\nodejs',
  'C:\\Program Files\\Git\\cmd',
];

const dedupePathEntries = (entries) => {
  const seen = new Set();
  const result = [];

  for (const entry of entries) {
    const normalized = String(entry ?? '').trim();
    if (!normalized) {
      continue;
    }

    const key =
      process.platform === 'win32' ? normalized.replace(/[\\/]+$/, '').toLowerCase() : normalized;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
};

const buildProcessPath = () => {
  const currentEntries = String(process.env.PATH ?? '')
    .split(path.delimiter)
    .filter(Boolean);

  if (process.platform !== 'win32') {
    return dedupePathEntries(currentEntries).join(path.delimiter);
  }

  const existingRequiredEntries = WINDOWS_REQUIRED_PATH_ENTRIES.filter((entry) =>
    fs.existsSync(entry)
  );
  return dedupePathEntries([...existingRequiredEntries, ...currentEntries]).join(path.delimiter);
};

const resolveNodeScript = (relativePath) => {
  const resolved = path.join(rootDir, relativePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Missing script: ${resolved}`);
  }

  return resolved;
};

const runNodeScript = (scriptPath, args, env) => {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    stdio: 'inherit',
    env,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.signal) {
    process.exit(1);
  }
};

const env = {
  ...process.env,
  PATH: buildProcessPath(),
  ELECTRON_MIRROR: 'https://npmmirror.com/mirrors/electron/',
  ELECTRON_BUILDER_BINARIES_MIRROR: 'https://npmmirror.com/mirrors/electron-builder-binaries/',
  ELECTRON_CACHE: '.cache\\electron',
  ELECTRON_BUILDER_CACHE: '.cache\\electron-builder',
};

runNodeScript(resolveNodeScript('node_modules/vite/bin/vite.js'), ['build'], env);
runNodeScript(
  resolveNodeScript('node_modules/electron-builder/cli.js'),
  ['--win', 'nsis', '--x64'],
  env
);
runNodeScript(resolveNodeScript('apps/desktop/main/scripts/cleanup-release-artifacts.cjs'), [], env);
