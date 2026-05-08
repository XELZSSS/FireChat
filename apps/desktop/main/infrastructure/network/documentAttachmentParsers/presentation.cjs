const {
  decodeXmlEntities,
  normalizeExtractedText,
  selectIndexedSegments,
} = require('./shared.cjs');

let cachedFflate = null;

const getFflate = () => {
  if (!cachedFflate) {
    cachedFflate = require('fflate');
  }

  return cachedFflate;
};

const parsePresentationBuffer = (buffer, pageRange) => {
  const { unzipSync, strFromU8 } = getFflate();
  const files = unzipSync(new Uint8Array(buffer));
  const slideNames = Object.keys(files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((left, right) => {
      const leftNumber = Number.parseInt(left.match(/\d+/)?.[0] ?? '0', 10);
      const rightNumber = Number.parseInt(right.match(/\d+/)?.[0] ?? '0', 10);
      return leftNumber - rightNumber;
    });

  const slideTexts = slideNames.map((name) => {
    const xml = strFromU8(files[name]);
    const fragments = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g), (match) =>
      decodeXmlEntities(match[1])
    );
    return normalizeExtractedText(fragments.join('\n'));
  });

  return normalizeExtractedText(
    selectIndexedSegments(slideTexts, pageRange).filter(Boolean).join('\n\n---\n\n')
  );
};

module.exports = {
  parsePresentationBuffer,
};
