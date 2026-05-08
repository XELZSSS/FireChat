import { resolveBaseUrl } from '@/infrastructure/providers/config/baseUrl';

const OPENCODE_RESPONSE_MODEL_PREFIX = 'gpt-';
const OPENCODE_ANTHROPIC_MODEL_PREFIX = 'claude-';
const OPENCODE_GOOGLE_MODEL_PREFIX = 'gemini-';
const OPENCODE_GO_MESSAGES_MODELS = new Set(['minimax-m2.7', 'minimax-m2.5']);
const OPENCODE_ENDPOINT_SUFFIX = /\/(?:chat\/completions|responses|messages|models)\/?$/i;

export type OpenCodeModelTransport = 'responses' | 'messages' | 'google' | 'chat_completions';

export const normalizeOpenCodeBaseUrl = (value: string): string =>
  resolveBaseUrl(value).replace(/\/+$/, '').replace(OPENCODE_ENDPOINT_SUFFIX, '');

const isGoBaseUrl = (baseUrl?: string): boolean => {
  return Boolean(baseUrl?.trim().replace(/\/+$/, '').toLowerCase().endsWith('/zen/go/v1'));
};

export const resolveOpenCodeModelTransport = (
  modelName: string,
  baseUrl?: string
): OpenCodeModelTransport => {
  const normalized = modelName.trim().toLowerCase();

  if (isGoBaseUrl(baseUrl) && OPENCODE_GO_MESSAGES_MODELS.has(normalized)) {
    return 'messages';
  }

  if (normalized.startsWith(OPENCODE_RESPONSE_MODEL_PREFIX)) {
    return 'responses';
  }

  if (normalized.startsWith(OPENCODE_ANTHROPIC_MODEL_PREFIX)) {
    return 'messages';
  }

  if (normalized.startsWith(OPENCODE_GOOGLE_MODEL_PREFIX)) {
    return 'google';
  }

  return 'chat_completions';
};

export const buildOpenCodeModelGroup = (modelName: string, baseUrl?: string): string => {
  switch (resolveOpenCodeModelTransport(modelName, baseUrl)) {
    case 'responses':
      return 'Responses';
    case 'messages':
      return 'Messages';
    case 'google':
      return 'Google';
    default:
      return 'Chat Completions';
  }
};
