const fs = require('fs');
const path = require('path');
const { isPlainObject } = require('./normalize.cjs');

const readJsonObjectFile = (filePath, emptyValue = {}) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    return isPlainObject(parsed) ? parsed : emptyValue;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return emptyValue;
    }
    throw error;
  }
};

const writeJsonFile = (filePath, value, { trailingNewline = false } = {}) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(value, null, 2)}${trailingNewline ? '\n' : ''}`,
    'utf8'
  );
};

module.exports = {
  readJsonObjectFile,
  writeJsonFile,
};
