export type ChatAttachmentReadErrorCode =
  | 'image'
  | 'too_large'
  | 'binary'
  | 'read_failed'
  | 'unsupported_extension'
  | 'empty_content'
  | 'parse_timeout'
  | 'page_range_invalid'
  | 'parser_failed'
  | 'parser_unavailable';

export class ChatAttachmentReadError extends Error {
  readonly code: ChatAttachmentReadErrorCode;

  constructor(code: ChatAttachmentReadErrorCode) {
    super(code);
    this.code = code;
  }
}
