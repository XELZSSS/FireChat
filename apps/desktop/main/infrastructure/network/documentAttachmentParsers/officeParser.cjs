const { normalizeExtractedText } = require('./shared.cjs');

let cachedOfficeParser = null;

const getParseOffice = () => {
  if (!cachedOfficeParser) {
    cachedOfficeParser = require('officeparser').parseOffice;
  }

  return cachedOfficeParser;
};

const parseOfficeBuffer = async (buffer) => {
  const parseOffice = getParseOffice();
  const ast = await parseOffice(buffer, {
    outputErrorToConsole: false,
  });

  return normalizeExtractedText(ast?.toText?.() ?? '');
};

module.exports = {
  parseOfficeBuffer,
};
