const { normalizeExtractedText, rowsToMarkdown } = require('./shared.cjs');

let cachedExcelParser = null;
let cachedOpenOfficeParser = null;

const getParseExcel = () => {
  if (!cachedExcelParser) {
    cachedExcelParser = require('officeparser/dist/parsers/ExcelParser.js').parseExcel;
  }

  return cachedExcelParser;
};

const getParseOpenOffice = () => {
  if (!cachedOpenOfficeParser) {
    cachedOpenOfficeParser =
      require('officeparser/dist/parsers/OpenOfficeParser.js').parseOpenOffice;
  }

  return cachedOpenOfficeParser;
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
  const parser = kind === 'ods' ? getParseOpenOffice() : getParseExcel();
  const documentAst = await parser(buffer, {
    outputErrorToConsole: false,
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
