const { normalizeExtractedText, selectIndexedSegments } = require('./shared.cjs');

const parsePdfBuffer = async (buffer, pageRange) => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;

  try {
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item) => item && typeof item.str === 'string')
        .map((item) => item.str + (item.hasEOL ? '\n' : ''))
        .join('');
      pages.push(normalizeExtractedText(pageText));
    }

    return normalizeExtractedText(
      selectIndexedSegments(pages, pageRange).filter(Boolean).join('\n\n---\n\n')
    );
  } finally {
    await loadingTask.destroy();
  }
};

module.exports = {
  parsePdfBuffer,
};
