export const AI_GATEWAY_IDS = ['cliproxyapi', 'new-api', 'sub2api', 'codex2api'] as const;
export const AI_GATEWAY_DUMMY_API_KEY = 'sk-dummy';

export type AiGatewayId = (typeof AI_GATEWAY_IDS)[number];

export type AiGatewaySettings = {
  enabled: boolean;
  gatewayId: AiGatewayId;
  baseUrl: string;
  apiKey: string;
};

export type AiGatewayDefinition = {
  id: AiGatewayId;
  label: string;
  defaultBaseUrl: string;
  projectUrl: string;
  iconSrc: string;
};

export type AiGatewayRequestConfig = {
  gatewayId: AiGatewayId;
  baseUrl: string;
  anthropicBaseUrl: string;
  geminiBaseUrl: string;
  apiKey?: string;
};

export type AiGatewayCallRequestConfig = AiGatewayRequestConfig;

export const AI_GATEWAY_DEFINITIONS: AiGatewayDefinition[] = [
  {
    id: 'cliproxyapi',
    label: 'CLIProxyAPI',
    defaultBaseUrl: 'http://127.0.0.1:8317/v1',
    projectUrl: 'https://github.com/router-for-me/CLIProxyAPI',
    iconSrc: './gateway-icons/cliproxyapi.png',
  },
  {
    id: 'new-api',
    label: 'New API',
    defaultBaseUrl: 'http://127.0.0.1:3000/v1',
    projectUrl: 'https://github.com/QuantumNous/new-api',
    iconSrc: './gateway-icons/new-api.png',
  },
  {
    id: 'sub2api',
    label: 'Sub2API',
    defaultBaseUrl: 'http://127.0.0.1:8080/v1',
    projectUrl: 'https://github.com/Wei-Shaw/sub2api',
    iconSrc: './gateway-icons/sub2api.png',
  },
  {
    id: 'codex2api',
    label: 'Codex2API',
    defaultBaseUrl: 'http://127.0.0.1:8080/v1',
    projectUrl: 'https://github.com/james-6-23/codex2api',
    iconSrc: './gateway-icons/codex2api.png',
  },
];

const DEFAULT_AI_GATEWAY_ID: AiGatewayId = 'cliproxyapi';
const AI_GATEWAY_ID_SET = new Set<string>(AI_GATEWAY_IDS);
const AI_GATEWAY_ENDPOINT_SUFFIX = /\/(?:chat\/completions|responses|messages|models)\/?$/i;
const AI_GATEWAY_API_VERSION_SUFFIX = /\/v1(?:beta)?$/i;

export const getDefaultAiGatewaySettings = (): AiGatewaySettings => ({
  enabled: false,
  gatewayId: DEFAULT_AI_GATEWAY_ID,
  baseUrl: getAiGatewayDefinition(DEFAULT_AI_GATEWAY_ID).defaultBaseUrl,
  apiKey: '',
});

export const isAiGatewayId = (value: unknown): value is AiGatewayId =>
  typeof value === 'string' && AI_GATEWAY_ID_SET.has(value);

export const getAiGatewayDefinition = (id: AiGatewayId): AiGatewayDefinition => {
  const definition = AI_GATEWAY_DEFINITIONS.find((item) => item.id === id);
  if (!definition) {
    throw new Error(`Unknown gateway: ${id}`);
  }

  return definition;
};

export const normalizeAiGatewayBaseUrl = (value: string): string =>
  value.trim().replace(/\/+$/, '').replace(AI_GATEWAY_ENDPOINT_SUFFIX, '').replace(/\/+$/, '');

export const normalizeAiGatewayApiBaseUrl = (value: string): string => {
  const normalizedRootBaseUrl = normalizeAiGatewayRootBaseUrl(value);
  if (!normalizedRootBaseUrl) {
    return '';
  }

  return `${normalizedRootBaseUrl}/v1`;
};

export const normalizeAiGatewayGeminiBaseUrl = (value: string): string => {
  const normalizedRootBaseUrl = normalizeAiGatewayRootBaseUrl(value);
  if (!normalizedRootBaseUrl) {
    return '';
  }

  return `${normalizedRootBaseUrl}/v1beta`;
};

const normalizeAiGatewayRootBaseUrl = (value: string): string =>
  normalizeAiGatewayBaseUrl(value).replace(AI_GATEWAY_API_VERSION_SUFFIX, '');

export const isValidAiGatewayBaseUrl = (value: string): boolean => {
  try {
    const url = new URL(normalizeAiGatewayBaseUrl(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const normalizeAiGatewaySettings = (
  value: unknown,
  currentSettings: Partial<AiGatewaySettings> = {}
): AiGatewaySettings => {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const record = raw as Partial<AiGatewaySettings>;
  const currentGatewayId = isAiGatewayId(currentSettings.gatewayId)
    ? currentSettings.gatewayId
    : DEFAULT_AI_GATEWAY_ID;
  const gatewayId = isAiGatewayId(record.gatewayId) ? record.gatewayId : currentGatewayId;
  const defaultBaseUrl = getAiGatewayDefinition(gatewayId).defaultBaseUrl;
  const baseUrl =
    typeof record.baseUrl === 'string' && record.baseUrl.trim()
      ? normalizeAiGatewayBaseUrl(record.baseUrl)
      : (currentSettings.baseUrl ?? defaultBaseUrl);

  return {
    enabled:
      typeof record.enabled === 'boolean' ? record.enabled : (currentSettings.enabled ?? false),
    gatewayId,
    baseUrl,
    apiKey:
      typeof record.apiKey === 'string' ? record.apiKey.trim() : (currentSettings.apiKey ?? ''),
  };
};

export const getAiGatewayRequestConfig = (
  settings: AiGatewaySettings
): AiGatewayRequestConfig | undefined => {
  if (!settings.enabled) {
    return undefined;
  }

  const baseUrl = normalizeAiGatewayBaseUrl(settings.baseUrl);
  if (!baseUrl || !isValidAiGatewayBaseUrl(baseUrl)) {
    return undefined;
  }

  return {
    gatewayId: settings.gatewayId,
    baseUrl: normalizeAiGatewayApiBaseUrl(baseUrl),
    anthropicBaseUrl: normalizeAiGatewayApiBaseUrl(baseUrl),
    geminiBaseUrl: normalizeAiGatewayGeminiBaseUrl(baseUrl),
    apiKey: settings.apiKey.trim() || undefined,
  };
};

export const buildAiGatewayModelsUrl = (baseUrl: string): string => {
  return `${normalizeAiGatewayApiBaseUrl(baseUrl)}/models`;
};
