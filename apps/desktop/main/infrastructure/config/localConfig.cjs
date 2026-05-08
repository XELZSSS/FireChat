/* global process */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { readJsonObjectFile, writeJsonFile } = require('../../shared/utils/jsonObjectFile.cjs');
const { normalizeText } = require('../../shared/utils/normalize.cjs');

const FIRECHAT_LOCAL_CONFIG_NAME = 'firechat.local.json';

const DEFAULT_CONFIG_CONTENTS = '{\n}\n';

const getUserDataConfigPath = (configName = FIRECHAT_LOCAL_CONFIG_NAME) => {
  return path.join(app.getPath('userData'), configName);
};

const getPreferredConfigPath = (configName = FIRECHAT_LOCAL_CONFIG_NAME) => {
  const userDataPath = getUserDataConfigPath(configName);
  if (app.isPackaged && userDataPath) {
    return userDataPath;
  }

  return path.resolve(process.cwd(), configName);
};

const getPreferredLocalConfigPath = () => getPreferredConfigPath(FIRECHAT_LOCAL_CONFIG_NAME);

const getConfigCandidates = (configName = FIRECHAT_LOCAL_CONFIG_NAME) => {
  const candidates = [getPreferredConfigPath(configName)];
  const userDataPath = getUserDataConfigPath(configName);
  const resourcesPath = normalizeText(process.resourcesPath);

  if (userDataPath) {
    candidates.push(userDataPath);
  }

  if (resourcesPath) {
    candidates.push(path.resolve(resourcesPath, configName));
  }

  return Array.from(new Set(candidates.filter(Boolean)));
};

const getLocalConfigCandidates = () => getConfigCandidates(FIRECHAT_LOCAL_CONFIG_NAME);

const readConfigFile = (configName = FIRECHAT_LOCAL_CONFIG_NAME) => {
  for (const candidate of getConfigCandidates(configName)) {
    const config = readJsonObjectFile(candidate, null);
    if (!config) {
      continue;
    }

    return config;
  }

  return null;
};

const writeConfigFile = (configName = FIRECHAT_LOCAL_CONFIG_NAME, value = {}) => {
  const configPath = ensureConfigFile(configName);
  const normalizedValue = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  writeJsonFile(configPath, normalizedValue, { trailingNewline: true });
  return configPath;
};

const updateConfigFile = (configName = FIRECHAT_LOCAL_CONFIG_NAME, recipe) => {
  const current = readConfigFile(configName) ?? {};
  const next = typeof recipe === 'function' ? recipe({ ...current }) : current;
  writeConfigFile(configName, next);
  return next;
};

const readFireChatLocalConfig = () => readConfigFile(FIRECHAT_LOCAL_CONFIG_NAME);

const ensureConfigFile = (
  configName = FIRECHAT_LOCAL_CONFIG_NAME,
  initialContents = DEFAULT_CONFIG_CONTENTS
) => {
  const configPath = getPreferredConfigPath(configName);
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, initialContents, 'utf8');
  }

  return configPath;
};

const ensureFireChatLocalConfigFile = () => ensureConfigFile(FIRECHAT_LOCAL_CONFIG_NAME);

module.exports = {
  FIRECHAT_LOCAL_CONFIG_NAME,
  ensureConfigFile,
  normalizeText,
  getConfigCandidates,
  getPreferredConfigPath,
  getPreferredLocalConfigPath,
  getLocalConfigCandidates,
  readConfigFile,
  readFireChatLocalConfig,
  updateConfigFile,
  ensureFireChatLocalConfigFile,
  writeConfigFile,
};
