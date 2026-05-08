import type { ChatAttachmentReadErrorCode } from '@/shared/utils/chatAttachmentErrors';

export const MAX_CHAT_ATTACHMENTS_PER_MESSAGE = 5;
export const MAX_CHAT_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_CHAT_ATTACHMENT_TEXT_LENGTH = 40000;

const IMAGE_FILE_EXTENSION_RE = /\.(gif|jpeg|jpg|png|webp)$/i;
const IMAGE_FILE_MIME_TYPES = new Set(['image/gif', 'image/jpeg', 'image/png', 'image/webp']);
const STRUCTURED_DOCUMENT_EXTENSION_RE = /\.(docx|pdf|ppt|pptx|rtf|xlsx|xlsm|odt|odp|ods)$/i;
const TEXT_FILE_EXTENSION_RE =
  /(^|\/)(dockerfile|makefile)$|\.(txt|text|md|markdown|rst|csv|tsv|json|jsonc|ya?ml|toml|ini|cfg|conf|env|log|xml|html?|css|scss|less|sass|js|jsx|mjs|cjs|ts|tsx|mts|cts|py|java|c|cc|cpp|cxx|h|hh|hpp|cs|go|rs|php|rb|swift|kt|kts|scala|sh|bash|zsh|ps1|bat|cmd|sql|vue|svelte|astro|dart|r|lua|pl|m|mm|gradle|properties)$/i;
const TEXT_FILE_MIME_PREFIXES = [
  'text/',
  'application/json',
  'application/ld+json',
  'application/xml',
  'application/javascript',
  'application/x-javascript',
  'application/typescript',
  'application/x-typescript',
  'application/x-sh',
  'application/sql',
  'application/toml',
  'application/x-yaml',
] as const;

const TEXT_FILE_ACCEPT_VALUES = [
  '.txt',
  '.text',
  '.md',
  '.markdown',
  '.rst',
  '.csv',
  '.tsv',
  '.json',
  '.jsonc',
  '.yaml',
  '.yml',
  '.toml',
  '.ini',
  '.cfg',
  '.conf',
  '.env',
  '.log',
  '.xml',
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.less',
  '.sass',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.py',
  '.java',
  '.c',
  '.cc',
  '.cpp',
  '.cxx',
  '.h',
  '.hh',
  '.hpp',
  '.cs',
  '.go',
  '.rs',
  '.php',
  '.rb',
  '.swift',
  '.kt',
  '.kts',
  '.scala',
  '.sh',
  '.bash',
  '.zsh',
  '.ps1',
  '.bat',
  '.cmd',
  '.sql',
  '.vue',
  '.svelte',
  '.astro',
  '.dart',
  '.r',
  '.lua',
  '.pl',
  '.m',
  '.mm',
  '.gradle',
  '.properties',
] as const;

const STRUCTURED_DOCUMENT_ACCEPT_VALUES = [
  '.docx',
  '.pdf',
  '.ppt',
  '.pptx',
  '.rtf',
  '.xlsx',
  '.xlsm',
  '.odt',
  '.odp',
  '.ods',
] as const;

const IMAGE_FILE_ACCEPT_VALUES = [
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
  ...IMAGE_FILE_MIME_TYPES,
] as const;

export const CHAT_ATTACHMENT_FILE_ACCEPT = [
  ...TEXT_FILE_ACCEPT_VALUES,
  ...STRUCTURED_DOCUMENT_ACCEPT_VALUES,
  ...IMAGE_FILE_ACCEPT_VALUES,
].join(',');

export const isImageFileLike = (file: File): boolean => {
  return IMAGE_FILE_MIME_TYPES.has(file.type) || IMAGE_FILE_EXTENSION_RE.test(file.name);
};

export const isStructuredDocumentFileLike = (file: File): boolean => {
  return STRUCTURED_DOCUMENT_EXTENSION_RE.test(file.name);
};

export const isTextLikeFile = (file: File): boolean => {
  const normalizedName = file.name.trim().toLowerCase();
  return (
    TEXT_FILE_EXTENSION_RE.test(normalizedName) ||
    TEXT_FILE_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))
  );
};

export const getChatAttachmentUploadRejectionCode = (
  file: File
): ChatAttachmentReadErrorCode | null => {
  if (file.size > MAX_CHAT_ATTACHMENT_SIZE_BYTES) {
    return 'too_large';
  }

  if (!isImageFileLike(file) && !isStructuredDocumentFileLike(file) && !isTextLikeFile(file)) {
    return 'unsupported_extension';
  }

  return null;
};
