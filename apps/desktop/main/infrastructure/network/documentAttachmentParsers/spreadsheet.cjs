const { normalizeExtractedText, rowsToMarkdown } = require('./shared.cjs');

let cachedParseOffice = null;

const getParseOffice = () => {
  if (!cachedParseOffice) {
    cachedParseOffice = require('officeparser').parseOffice;
  }

  return cachedParseOffice;
};

const extractSheetRows = (sheetNode) => {
  if (!sheetNode || !Array.isArray(sheetNode.children)) {
    return [];
  }

  return sheetNode.children.map((rowNode) => {
    if (!rowNode || !Array.isArray(rowNode.children) || rowNode.children.length === 0) {
      return [];
    }

    const maxColumnIndex = rowNode.children.reduce((max, cellNode) => {
      const nextIndex = Number.isInteger(cellNode?.metadata?.col) ? cellNode.metadata.col : 0;
      return Math.max(max, nextIndex);
    }, 0);
    const row = Array.from({ length: maxColumnIndex + 1 }, () => '');

    for (const cellNode of rowNode.children) {
      const columnIndex = Number.isInteger(cellNode?.metadata?.col) ? cellNode.metadata.col : 0;
      row[columnIndex] = String(cellNode?.text ?? '').trim();
    }

    return row;
  });
};

const toSheetMarkdownSections = (documentAst) => {
  const sheets = Array.isArray(documentAst?.content)
    ? documentAst.content.filter((node) => node?.type === 'sheet')
    : [];

  if (sheets.length === 0) {
    return [];
  }

  return sheets.map((sheetNode, index) => {
    const sheetName = sheetNode?.metadata?.sheetName || `Sheet${index + 1}`;
    const markdown = rowsToMarkdown(extractSheetRows(sheetNode));
    return markdown ? `**${sheetName}:**\n${markdown}` : `**${sheetName}:**`;
  });
};

const parseSpreadsheetBuffer = async (buffer, kind) => {
  const parseOffice = getParseOffice();
  const documentAst = await parseOffice(buffer, {
    outputErrorToConsole: false,
    fileType: kind,
  });
  const sections = toSheetMarkdownSections(documentAst);

  if (sections.length === 0) {
    return normalizeExtractedText(documentAst?.toText?.() ?? '');
  }

  return normalizeExtractedText(sections.join('\n\n'));
};

module.exports = {
  parseSpreadsheetBuffer,
};
