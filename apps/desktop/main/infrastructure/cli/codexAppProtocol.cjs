const extractCodexDelta = (params) => {
  if (!params || typeof params !== 'object') {
    return '';
  }

  const item = params.item && typeof params.item === 'object' ? params.item : undefined;
  const candidates = [
    params.delta,
    params.text,
    params.content,
    item?.delta,
    item?.text,
    item?.content,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      return candidate;
    }
  }

  return '';
};

const extractCodexCompletedText = (params) => {
  const item = params?.item && typeof params.item === 'object' ? params.item : undefined;
  if (!item) {
    return '';
  }

  if (item.type === 'agentMessage' && typeof item.text === 'string') {
    return item.text;
  }

  const content = Array.isArray(item.content) ? item.content : [];
  return content
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('');
};

const resolveCodexTurnId = (params) => {
  if (!params || typeof params !== 'object') {
    return undefined;
  }
  if (typeof params.turnId === 'string') {
    return params.turnId;
  }
  if (params.turn && typeof params.turn.id === 'string') {
    return params.turn.id;
  }
  if (params.item && typeof params.item.turnId === 'string') {
    return params.item.turnId;
  }
  return undefined;
};

const parseCodexAppMessage = (line) => {
  const trimmed = line.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
};

const isCodexAppResponse = (message) =>
  message?.id !== undefined && (message.result !== undefined || message.error !== undefined);

const isCodexAppServerRequest = (message) =>
  message?.id !== undefined && typeof message.method === 'string';

const isCodexAppNotification = (message) => typeof message?.method === 'string';

module.exports = {
  extractCodexCompletedText,
  extractCodexDelta,
  isCodexAppNotification,
  isCodexAppResponse,
  isCodexAppServerRequest,
  parseCodexAppMessage,
  resolveCodexTurnId,
};
