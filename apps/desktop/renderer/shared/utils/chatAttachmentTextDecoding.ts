import { ChatAttachmentReadError } from '@/shared/utils/chatAttachmentErrors';

type TextEncoding = 'utf-8' | 'utf-16le' | 'utf-16be';
type LegacyTextEncoding = 'gb18030' | 'big5' | 'shift_jis' | 'euc-kr' | 'windows-1252';
type SupportedTextEncoding = TextEncoding | LegacyTextEncoding;

const MAX_BINARY_CONTENT_SAMPLE_LENGTH = 4000;
const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;
const UTF16LE_BOM = [0xff, 0xfe] as const;
const UTF16BE_BOM = [0xfe, 0xff] as const;
const TEXT_DECODERS: Record<TextEncoding, TextDecoder> = {
  'utf-8': new TextDecoder('utf-8'),
  'utf-16le': new TextDecoder('utf-16le'),
  'utf-16be': new TextDecoder('utf-16be'),
};
const UTF8_FATAL_DECODER = new TextDecoder('utf-8', { fatal: true });
const LEGACY_TEXT_ENCODINGS: LegacyTextEncoding[] = [
  'gb18030',
  'big5',
  'shift_jis',
  'euc-kr',
  'windows-1252',
];

const startsWithBytes = (bytes: Uint8Array, prefix: readonly number[]): boolean => {
  return prefix.every((value, index) => bytes[index] === value);
};

const decodeWithEncoding = (bytes: Uint8Array, encoding: TextEncoding): string => {
  return TEXT_DECODERS[encoding].decode(bytes);
};

const decodeWithFatalEncoding = (bytes: Uint8Array, encoding: SupportedTextEncoding): string => {
  return new TextDecoder(encoding, { fatal: true }).decode(bytes);
};

const decodeTextFromBom = (bytes: Uint8Array): string | null => {
  if (startsWithBytes(bytes, UTF8_BOM)) {
    return decodeWithEncoding(bytes.subarray(UTF8_BOM.length), 'utf-8');
  }

  if (startsWithBytes(bytes, UTF16LE_BOM)) {
    return decodeWithEncoding(bytes.subarray(UTF16LE_BOM.length), 'utf-16le');
  }

  if (startsWithBytes(bytes, UTF16BE_BOM)) {
    return decodeWithEncoding(bytes.subarray(UTF16BE_BOM.length), 'utf-16be');
  }

  return null;
};

const looksLikeUtf16 = (bytes: Uint8Array, offsetParity: 0 | 1): boolean => {
  const sampleSize = Math.min(bytes.length, 128);
  if (sampleSize < 8) {
    return false;
  }

  let zeroCount = 0;
  let totalCount = 0;
  for (let index = offsetParity; index < sampleSize; index += 2) {
    totalCount += 1;
    if (bytes[index] === 0) {
      zeroCount += 1;
    }
  }

  return totalCount > 0 && zeroCount / totalCount >= 0.35;
};

export const decodeTextFile = (bytes: Uint8Array, { tryLegacyEncodings = false } = {}): string => {
  const bomDecoded = decodeTextFromBom(bytes);
  if (bomDecoded !== null) {
    return bomDecoded;
  }

  try {
    return UTF8_FATAL_DECODER.decode(bytes);
  } catch {
    if (looksLikeUtf16(bytes, 1)) {
      return decodeWithEncoding(bytes, 'utf-16le');
    }

    if (looksLikeUtf16(bytes, 0)) {
      return decodeWithEncoding(bytes, 'utf-16be');
    }

    if (tryLegacyEncodings) {
      for (const encoding of LEGACY_TEXT_ENCODINGS) {
        try {
          return decodeWithFatalEncoding(bytes, encoding);
        } catch {
          // Try the next encoding.
        }
      }
    }

    throw new ChatAttachmentReadError('binary');
  }
};

export const hasBinaryLikeContent = (text: string): boolean => {
  if (!text) {
    return false;
  }

  const sample = text.slice(0, MAX_BINARY_CONTENT_SAMPLE_LENGTH);
  let suspiciousScore = 0;

  for (const character of sample) {
    const code = character.charCodeAt(0);
    if (code === 0) {
      return true;
    }

    if (code === 0xfffd) {
      suspiciousScore += 4;
      continue;
    }

    if ((code < 32 && code !== 9 && code !== 10 && code !== 13 && code !== 12) || code === 127) {
      suspiciousScore += 1;
    }
  }

  return suspiciousScore / Math.max(sample.length, 1) > 0.05;
};
