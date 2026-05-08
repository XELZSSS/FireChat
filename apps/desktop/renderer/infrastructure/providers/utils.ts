export const sanitizeApiKey = (value?: string): string | undefined => {
  if (!value || value === 'undefined') return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^PLACEHOLDER_/i.test(trimmed)) return undefined;
  return trimmed.length > 0 ? trimmed : undefined;
};

export const DEFAULT_MAX_TOOL_CALL_ROUNDS = 5;
export const MIN_TOOL_CALL_ROUNDS = 1;
export const MAX_TOOL_CALL_ROUNDS = 12;
