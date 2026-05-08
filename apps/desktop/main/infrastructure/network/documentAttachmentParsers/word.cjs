const { normalizeExtractedText } = require('./shared.cjs');

let cachedMammoth = null;

const getMammoth = () => {
  if (!cachedMammoth) {
    cachedMammoth = require('mammoth');
  }

  return cachedMammoth;
};

const parseWordBuffer = async (buffer) => {
  const mammoth = getMammoth();
  const result = await mammoth.extractRawText({ buffer });
  return normalizeExtractedText(result.value);
};

module.exports = {
  parseWordBuffer,
};
