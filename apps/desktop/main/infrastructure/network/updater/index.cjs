const https = require('node:https');
const { app, BrowserWindow, dialog, shell } = require('electron');
const { getDistributionMode } = require('../../config/distribution.cjs');
const { IPC_CHANNELS } = require('../../../application/ipc/channels.cjs');

const GITHUB_REPO = 'XELZSSS/FireChat';
const GITHUB_API_LATEST_RELEASE_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const UPDATE_CHECK_TIMEOUT_MS = 15000;

let initialized = false;
let availableReleaseUrl = '';
let updatePromptVersion = '';

const updaterState = {
  status: 'idle',
  distribution: getDistributionMode(),
  message: '',
  version: app.getVersion(),
  availableVersion: '',
  error: '',
};

const cloneState = () => ({ ...updaterState });

const emitStatus = () => {
  const windows = BrowserWindow.getAllWindows().filter((win) => !win.isDestroyed());
  for (const win of windows) {
    if (win.webContents.isDestroyed()) {
      continue;
    }

    try {
      win.webContents.send(IPC_CHANNELS.updater.status, cloneState());
    } catch (sendError) {
      console.error('Failed to send updater status to renderer:', sendError);
    }
  }
};

const setState = (patch) => {
  Object.assign(updaterState, patch, {
    distribution: getDistributionMode(),
  });
  emitStatus();
};

const getErrorMessage = (error) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean' || typeof error === 'bigint') {
    return `${error}`;
  }

  try {
    return JSON.stringify(error) ?? 'Unknown error';
  } catch {
    return 'Unknown error';
  }
};

const normalizeVersion = (value) =>
  String(value ?? '')
    .trim()
    .replace(/^v/i, '');

const parseVersionNumbers = (version) =>
  normalizeVersion(version)
    .split(/[+-]/)[0]
    .split('.')
    .map((part) => {
      const parsed = Number.parseInt(part, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    });

const compareVersions = (candidate, current) => {
  const candidateParts = parseVersionNumbers(candidate);
  const currentParts = parseVersionNumbers(current);

  for (let index = 0; index < 3; index += 1) {
    const candidateValue = candidateParts[index] ?? 0;
    const currentValue = currentParts[index] ?? 0;
    if (candidateValue > currentValue) return 1;
    if (candidateValue < currentValue) return -1;
  }

  return 0;
};

const readLatestGithubRelease = () =>
  new Promise((resolve, reject) => {
    const request = https.request(
      GITHUB_API_LATEST_RELEASE_URL,
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': `FireChat/${app.getVersion()}`,
        },
      },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          if (response.statusCode === 404) {
            resolve(null);
            return;
          }

          if (response.statusCode !== 200) {
            reject(
              new Error(
                `GitHub update check failed with status ${response.statusCode ?? 'unknown'}.`
              )
            );
            return;
          }

          try {
            const payload = JSON.parse(body);
            const version = normalizeVersion(payload?.tag_name);
            const pageUrl = String(payload?.html_url ?? '').trim();
            if (!version || !pageUrl) {
              throw new Error('Latest GitHub release is missing version or page URL.');
            }

            resolve({ version, pageUrl });
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.setTimeout(UPDATE_CHECK_TIMEOUT_MS, () => {
      request.destroy(new Error('GitHub update check timed out.'));
    });
    request.on('error', reject);
    request.end();
  });

const getDialogWindow = () =>
  BrowserWindow.getFocusedWindow() ??
  BrowserWindow.getAllWindows().find((win) => !win.isDestroyed()) ??
  null;

const showUpdaterDialog = async (options) => {
  const parentWindow = getDialogWindow();
  if (parentWindow) {
    return dialog.showMessageBox(parentWindow, options);
  }

  return dialog.showMessageBox(options);
};

const openAvailableReleasePage = async () => {
  if (!app.isPackaged) {
    return cloneState();
  }

  if (updaterState.status !== 'available' || !availableReleaseUrl) {
    throw new Error('No GitHub release download page is ready. Check for updates again.');
  }

  await shell.openExternal(availableReleaseUrl);
  return cloneState();
};

const showUpdateAvailablePrompt = ({ version }) => {
  if (!version || updatePromptVersion === version) {
    return;
  }

  updatePromptVersion = version;
  void showUpdaterDialog({
    type: 'info',
    buttons: ['下载', '稍后'],
    defaultId: 0,
    cancelId: 1,
    title: '发现更新',
    message: `发现 FireChat v${version}`,
    detail: '点击下载会打开系统浏览器前往 GitHub Release 页面。',
  })
    .then(({ response }) => {
      if (response !== 0) {
        return;
      }

      void openAvailableReleasePage().catch((error) => {
        setState({
          status: 'error',
          message: 'Failed to open update download page.',
          error: getErrorMessage(error),
        });
      });
    })
    .catch((error) => {
      console.error('Failed to show update prompt:', error);
    });
};

const initializeDevelopmentUpdater = () => {
  availableReleaseUrl = '';
  setState({
    status: 'disabled',
    message: 'Auto update is disabled in development mode.',
    availableVersion: '',
    error: '',
  });
};

const initUpdater = () => {
  if (initialized) {
    return;
  }

  initialized = true;

  if (!app.isPackaged) {
    initializeDevelopmentUpdater();
  }
};

const checkForUpdates = async () => {
  if (!app.isPackaged) {
    initializeDevelopmentUpdater();
    return cloneState();
  }

  setState({
    status: 'checking',
    message: 'Checking for updates...',
    availableVersion: '',
    error: '',
  });

  try {
    const latestRelease = await readLatestGithubRelease();
    if (!latestRelease || compareVersions(latestRelease.version, app.getVersion()) <= 0) {
      availableReleaseUrl = '';
      setState({
        status: 'not-available',
        message: 'You are using the latest version.',
        availableVersion: '',
        error: '',
      });
      return cloneState();
    }

    availableReleaseUrl = latestRelease.pageUrl;
    setState({
      status: 'available',
      message: 'Update found.',
      availableVersion: latestRelease.version,
      error: '',
    });
    showUpdateAvailablePrompt(latestRelease);
    return cloneState();
  } catch (error) {
    availableReleaseUrl = '';
    setState({
      status: 'error',
      message: 'Failed to check updates.',
      availableVersion: '',
      error: getErrorMessage(error),
    });
    return cloneState();
  }
};

const openUpdateDownload = async () => {
  try {
    return await openAvailableReleasePage();
  } catch (error) {
    setState({
      status: 'error',
      message: 'Failed to open update download page.',
      error: getErrorMessage(error),
    });
    return cloneState();
  }
};

const getUpdaterState = () => cloneState();

module.exports = {
  initUpdater,
  checkForUpdates,
  openUpdateDownload,
  getUpdaterState,
};
