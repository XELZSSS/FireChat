import { ProviderId } from '@/shared/types/chat';
import { getRuntimeEnvValue } from '@/infrastructure/config/runtimeEnv';

export type ProviderRegion = 'intl' | 'cn';
export type GlmEndpointMode = 'api' | 'coding';
export type GlmEndpointSelection = {
  region: ProviderRegion;
  mode: GlmEndpointMode;
};
export type MoonshotEndpointMode = 'api' | 'coding';
export type MoonshotEndpointSelection = {
  region?: ProviderRegion;
  mode: MoonshotEndpointMode;
};

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const POE_BASE_URL = 'https://api.poe.com/v1';
const GOOGLE_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GOOGLE_VERTEX_BASE_URL = 'https://aiplatform.googleapis.com/v1/publishers/google';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const TOGETHER_BASE_URL = 'https://api.together.xyz/v1';
const FIREWORKS_BASE_URL = 'https://api.fireworks.ai/inference/v1';
const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1';
const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';
const COHERE_BASE_URL = 'https://api.cohere.com/v2';
const SAMBANOVA_BASE_URL = 'https://api.sambanova.ai/v1';
const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1';
const LONGCAT_BASE_URL = 'https://api.longcat.chat/openai/v1';
const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const VERCEL_BASE_URL = 'https://api.v0.dev/v1';
const OPEN_RESPONSES_URL = undefined;
const DEEPINFRA_BASE_URL = 'https://api.deepinfra.com/v1/openai';
const HUGGINGFACE_BASE_URL = 'https://router.huggingface.co/v1';
const ALIBABA_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const AMAZON_BEDROCK_BASE_URL = undefined;
const AZURE_OPENAI_BASE_URL = undefined;
const BASETEN_BASE_URL = 'https://inference.baseten.co/v1';
const NVIDIA_NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const CLARIFAI_BASE_URL = 'https://api.clarifai.com/v2/ext/openai/v1';
const HEROKU_BASE_URL = 'https://us.inference.heroku.com/v1';
const LM_STUDIO_BASE_URL = 'http://localhost:1234/v1';
const MODELSCOPE_BASE_URL = 'https://api-inference.modelscope.cn/v1';
const MODAL_BASE_URL = undefined;
const OPENADAPTER_BASE_URL = 'https://api.openadapter.in/v1';
const OPENCODE_ZEN_BASE_URL = 'https://opencode.ai/zen/v1';
const OPENCODE_GO_BASE_URL = 'https://opencode.ai/zen/go/v1';
const OPENCODE_BASE_URL = OPENCODE_ZEN_BASE_URL;
const XAI_BASE_URL = 'https://api.x.ai/v1';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const VOLCENGINE_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const XIAOMI_MIMO_BASE_URL = 'https://api.xiaomimimo.com/v1';
const MULEROUTER_BASE_URL = 'https://api.mulerouter.ai/v1';

type RuntimeEnvKey = Parameters<typeof getRuntimeEnvValue>[0];

const createDefaultBaseUrlResolver = <T extends string | undefined>(
  providerId: ProviderId,
  envKey: RuntimeEnvKey,
  defaultBaseUrl: T
): (() => T extends string ? string : string | undefined) =>
  (() =>
    normalizeEnvBaseUrl(providerId, getRuntimeEnvValue(envKey)) ??
    defaultBaseUrl) as () => T extends string ? string : string | undefined;

const MINIMAX_BASE_URLS = {
  intl: 'https://api.minimax.io/v1',
  cn: 'https://api.minimaxi.com/v1',
} as const;

const MOONSHOT_BASE_URLS = {
  intl: 'https://api.moonshot.ai/v1',
  cn: 'https://api.moonshot.cn/v1',
} as const;

const MOONSHOT_CODING_BASE_URL = 'https://api.kimi.com/coding/v1';

const GLM_BASE_URLS = {
  intl: 'https://api.z.ai/api/paas/v4',
  cn: 'https://open.bigmodel.cn/api/paas/v4',
} as const;

const GLM_CODING_BASE_URLS = {
  intl: 'https://api.z.ai/api/coding/paas/v4',
  cn: 'https://open.bigmodel.cn/api/coding/paas/v4',
} as const;

const STEPFUN_BASE_URLS = {
  intl: 'https://api.stepfun.ai/v1',
  cn: 'https://api.stepfun.com/v1',
} as const;

const normalizeGlmBaseUrl = (value: string): string => {
  return resolveBaseUrl(value).replace(/\/responses\/?$/i, '');
};

const getNormalizedGlmBaseUrlKey = (value: string): string => {
  return normalizeGlmBaseUrl(value).replace(/\/+$/, '').toLowerCase();
};

const getNormalizedBaseUrlKey = (value: string): string => {
  return resolveBaseUrl(value).replace(/\/+$/, '').toLowerCase();
};

export const normalizeBaseUrlForProvider = (providerId: ProviderId, value: string): string => {
  if (providerId === 'glm') {
    return normalizeGlmBaseUrl(value);
  }
  return resolveBaseUrl(value);
};

const normalizeEnvBaseUrl = (
  providerId: ProviderId | undefined,
  value?: string
): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === 'undefined') return undefined;
  if (!providerId) return resolveBaseUrl(trimmed);
  return normalizeBaseUrlForProvider(providerId, trimmed);
};

const prefersChinaEndpoint = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const lang = navigator.language?.toLowerCase() ?? '';
  return lang.startsWith('zh');
};

export const resolveBaseUrl = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (typeof window !== 'undefined') {
    return new URL(trimmed, window.location.origin).toString();
  }
  return trimmed;
};

export const resolveBaseUrlWithDefault = (
  override: string | undefined,
  getDefaultBaseUrl: () => string,
  normalize: (value: string) => string = resolveBaseUrl
): string => {
  const raw = override?.trim() || getDefaultBaseUrl();
  return raw ? normalize(raw) : getDefaultBaseUrl();
};

const resolveRegionalDefaultBaseUrl = (
  providerId: ProviderId,
  envOverride: string | undefined,
  urls: { intl: string; cn: string }
): string => {
  const resolvedOverride = normalizeEnvBaseUrl(providerId, envOverride);
  if (resolvedOverride) return resolvedOverride;
  if (prefersChinaEndpoint()) return normalizeBaseUrlForProvider(providerId, urls.cn);
  return normalizeBaseUrlForProvider(providerId, urls.intl);
};

export const getMinimaxBaseUrlForRegion = (region: ProviderRegion): string => {
  return resolveBaseUrl(region === 'cn' ? MINIMAX_BASE_URLS.cn : MINIMAX_BASE_URLS.intl);
};

export const getDefaultMinimaxBaseUrl = (): string => {
  return resolveRegionalDefaultBaseUrl(
    'minimax',
    getRuntimeEnvValue('MINIMAX_BASE_URL'),
    MINIMAX_BASE_URLS
  );
};

export const getMoonshotBaseUrlForRegion = (region: ProviderRegion): string => {
  return resolveBaseUrl(region === 'cn' ? MOONSHOT_BASE_URLS.cn : MOONSHOT_BASE_URLS.intl);
};

export const getMoonshotBaseUrlForEndpoint = (
  region: ProviderRegion,
  mode: MoonshotEndpointMode
): string => {
  return resolveBaseUrl(mode === 'coding' ? MOONSHOT_CODING_BASE_URL : MOONSHOT_BASE_URLS[region]);
};

export const resolveMoonshotEndpointSelection = (
  baseUrl?: string
): MoonshotEndpointSelection | undefined => {
  const rawBaseUrl = baseUrl?.trim();
  if (!rawBaseUrl) return undefined;

  const baseUrlKey = getNormalizedBaseUrlKey(rawBaseUrl);
  const regions: ProviderRegion[] = ['intl', 'cn'];

  for (const region of regions) {
    if (baseUrlKey === getNormalizedBaseUrlKey(getMoonshotBaseUrlForEndpoint(region, 'api'))) {
      return { region, mode: 'api' };
    }
  }

  if (baseUrlKey === getNormalizedBaseUrlKey(MOONSHOT_CODING_BASE_URL)) {
    return { mode: 'coding' };
  }

  return undefined;
};

export const getDefaultMoonshotBaseUrl = (): string => {
  return resolveRegionalDefaultBaseUrl(
    'moonshot',
    getRuntimeEnvValue('MOONSHOT_BASE_URL'),
    MOONSHOT_BASE_URLS
  );
};

export const getGlmBaseUrlForRegion = (region: ProviderRegion): string => {
  return normalizeBaseUrlForProvider(
    'glm',
    region === 'cn' ? GLM_BASE_URLS.cn : GLM_BASE_URLS.intl
  );
};

export const getGlmBaseUrlForEndpoint = (region: ProviderRegion, mode: GlmEndpointMode): string => {
  const urls = mode === 'coding' ? GLM_CODING_BASE_URLS : GLM_BASE_URLS;
  return normalizeBaseUrlForProvider('glm', urls[region]);
};

export const resolveGlmEndpointSelection = (baseUrl?: string): GlmEndpointSelection | undefined => {
  const rawBaseUrl = baseUrl?.trim();
  if (!rawBaseUrl) return undefined;

  const baseUrlKey = getNormalizedGlmBaseUrlKey(rawBaseUrl);
  const modes: GlmEndpointMode[] = ['api', 'coding'];
  const regions: ProviderRegion[] = ['intl', 'cn'];

  for (const mode of modes) {
    for (const region of regions) {
      if (baseUrlKey === getNormalizedGlmBaseUrlKey(getGlmBaseUrlForEndpoint(region, mode))) {
        return { region, mode };
      }
    }
  }

  return undefined;
};

export const getDefaultGlmBaseUrl = (): string => {
  return resolveRegionalDefaultBaseUrl('glm', getRuntimeEnvValue('GLM_BASE_URL'), GLM_BASE_URLS);
};

export const getStepFunBaseUrlForRegion = (region: ProviderRegion): string => {
  return resolveBaseUrl(region === 'cn' ? STEPFUN_BASE_URLS.cn : STEPFUN_BASE_URLS.intl);
};

export const getDefaultStepFunBaseUrl = (): string => {
  return resolveRegionalDefaultBaseUrl(
    'stepfun',
    getRuntimeEnvValue('STEPFUN_BASE_URL'),
    STEPFUN_BASE_URLS
  );
};

export const getDefaultOpenAIBaseUrl = createDefaultBaseUrlResolver(
  'openai',
  'OPENAI_BASE_URL',
  OPENAI_BASE_URL
);
export const getDefaultOpenRouterBaseUrl = createDefaultBaseUrlResolver(
  'openrouter',
  'OPENROUTER_BASE_URL',
  OPENROUTER_BASE_URL
);
export const getDefaultPoeBaseUrl = createDefaultBaseUrlResolver(
  'poe',
  'POE_BASE_URL',
  POE_BASE_URL
);
export const getDefaultGoogleBaseUrl = createDefaultBaseUrlResolver(
  'google',
  'GOOGLE_GENERATIVE_AI_BASE_URL',
  GOOGLE_BASE_URL
);
export const getDefaultGoogleVertexBaseUrl = createDefaultBaseUrlResolver(
  'google-vertex',
  'GOOGLE_VERTEX_BASE_URL',
  GOOGLE_VERTEX_BASE_URL
);
export const getDefaultGroqBaseUrl = createDefaultBaseUrlResolver(
  'groq',
  'GROQ_BASE_URL',
  GROQ_BASE_URL
);
export const getDefaultTogetherBaseUrl = createDefaultBaseUrlResolver(
  'together',
  'TOGETHER_BASE_URL',
  TOGETHER_BASE_URL
);
export const getDefaultFireworksBaseUrl = createDefaultBaseUrlResolver(
  'fireworks',
  'FIREWORKS_BASE_URL',
  FIREWORKS_BASE_URL
);
export const getDefaultCerebrasBaseUrl = createDefaultBaseUrlResolver(
  'cerebras',
  'CEREBRAS_BASE_URL',
  CEREBRAS_BASE_URL
);
export const getDefaultPerplexityBaseUrl = createDefaultBaseUrlResolver(
  'perplexity',
  'PERPLEXITY_BASE_URL',
  PERPLEXITY_BASE_URL
);
export const getDefaultCohereBaseUrl = createDefaultBaseUrlResolver(
  'cohere',
  'COHERE_BASE_URL',
  COHERE_BASE_URL
);
export const getDefaultSambanovaBaseUrl = createDefaultBaseUrlResolver(
  'sambanova',
  'SAMBANOVA_BASE_URL',
  SAMBANOVA_BASE_URL
);
export const getDefaultMistralBaseUrl = createDefaultBaseUrlResolver(
  'mistral',
  'MISTRAL_BASE_URL',
  MISTRAL_BASE_URL
);
export const getDefaultLongcatBaseUrl = createDefaultBaseUrlResolver(
  'longcat',
  'LONGCAT_BASE_URL',
  LONGCAT_BASE_URL
);
export const getDefaultAnthropicBaseUrl = createDefaultBaseUrlResolver(
  'anthropic',
  'ANTHROPIC_BASE_URL',
  ANTHROPIC_BASE_URL
);
export const getDefaultVercelBaseUrl = createDefaultBaseUrlResolver(
  'vercel',
  'VERCEL_BASE_URL',
  VERCEL_BASE_URL
);
export const getDefaultOpenResponsesUrl = createDefaultBaseUrlResolver(
  'open-responses',
  'OPEN_RESPONSES_URL',
  OPEN_RESPONSES_URL
);
export const getDefaultDeepInfraBaseUrl = createDefaultBaseUrlResolver(
  'deepinfra',
  'DEEPINFRA_BASE_URL',
  DEEPINFRA_BASE_URL
);
export const getDefaultHuggingFaceBaseUrl = createDefaultBaseUrlResolver(
  'huggingface',
  'HUGGINGFACE_BASE_URL',
  HUGGINGFACE_BASE_URL
);
export const getDefaultAlibabaBaseUrl = createDefaultBaseUrlResolver(
  'alibaba',
  'ALIBABA_BASE_URL',
  ALIBABA_BASE_URL
);
export const getDefaultAmazonBedrockBaseUrl = createDefaultBaseUrlResolver(
  'amazon-bedrock',
  'AMAZON_BEDROCK_BASE_URL',
  AMAZON_BEDROCK_BASE_URL
);
export const getDefaultAzureOpenAIBaseUrl = createDefaultBaseUrlResolver(
  'azure-openai',
  'AZURE_OPENAI_BASE_URL',
  AZURE_OPENAI_BASE_URL
);
export const getDefaultBasetenBaseUrl = createDefaultBaseUrlResolver(
  'baseten',
  'BASETEN_BASE_URL',
  BASETEN_BASE_URL
);
export const getDefaultNvidiaNimBaseUrl = createDefaultBaseUrlResolver(
  'nvidia-nim',
  'NVIDIA_NIM_BASE_URL',
  NVIDIA_NIM_BASE_URL
);
export const getDefaultClarifaiBaseUrl = createDefaultBaseUrlResolver(
  'clarifai',
  'CLARIFAI_BASE_URL',
  CLARIFAI_BASE_URL
);
export const getDefaultHerokuBaseUrl = createDefaultBaseUrlResolver(
  'heroku',
  'HEROKU_BASE_URL',
  HEROKU_BASE_URL
);
export const getDefaultLmStudioBaseUrl = createDefaultBaseUrlResolver(
  'lm-studio',
  'LM_STUDIO_BASE_URL',
  LM_STUDIO_BASE_URL
);
export const getDefaultModelScopeBaseUrl = createDefaultBaseUrlResolver(
  'modelscope',
  'MODELSCOPE_BASE_URL',
  MODELSCOPE_BASE_URL
);
export const getDefaultModalBaseUrl = createDefaultBaseUrlResolver(
  'modal',
  'MODAL_BASE_URL',
  MODAL_BASE_URL
);
export const getDefaultOpenAdapterBaseUrl = createDefaultBaseUrlResolver(
  'openadapter',
  'OPENADAPTER_BASE_URL',
  OPENADAPTER_BASE_URL
);
export const getDefaultOpenCodeBaseUrl = createDefaultBaseUrlResolver(
  'opencode',
  'OPENCODE_BASE_URL',
  OPENCODE_BASE_URL
);
export const getOpenCodeBaseUrlForEndpoint = (endpoint: 'zen' | 'go'): string => {
  return endpoint === 'go' ? OPENCODE_GO_BASE_URL : OPENCODE_ZEN_BASE_URL;
};
export const getDefaultXaiBaseUrl = createDefaultBaseUrlResolver(
  'xai',
  'XAI_BASE_URL',
  XAI_BASE_URL
);
export const getDefaultDeepSeekBaseUrl = createDefaultBaseUrlResolver(
  'deepseek',
  'DEEPSEEK_BASE_URL',
  DEEPSEEK_BASE_URL
);
export const getDefaultVolcengineBaseUrl = createDefaultBaseUrlResolver(
  'volcengine',
  'VOLCENGINE_BASE_URL',
  VOLCENGINE_BASE_URL
);
export const getDefaultXiaomiMimoBaseUrl = createDefaultBaseUrlResolver(
  'xiaomi-mimo',
  'XIAOMI_BASE_URL',
  XIAOMI_MIMO_BASE_URL
);
export const getDefaultMuleRouterBaseUrl = createDefaultBaseUrlResolver(
  'mulerouter',
  'MULEROUTER_BASE_URL',
  MULEROUTER_BASE_URL
);
export const getDefaultOpenAICompatibleBaseUrl = createDefaultBaseUrlResolver(
  'openai-compatible',
  'OPENAI_COMPATIBLE_BASE_URL',
  undefined
);

const providerDefaultBaseUrlResolvers: Partial<Record<ProviderId, () => string | undefined>> = {
  openai: getDefaultOpenAIBaseUrl,
  openrouter: getDefaultOpenRouterBaseUrl,
  poe: getDefaultPoeBaseUrl,
  google: getDefaultGoogleBaseUrl,
  'google-vertex': getDefaultGoogleVertexBaseUrl,
  groq: getDefaultGroqBaseUrl,
  together: getDefaultTogetherBaseUrl,
  fireworks: getDefaultFireworksBaseUrl,
  cerebras: getDefaultCerebrasBaseUrl,
  perplexity: getDefaultPerplexityBaseUrl,
  cohere: getDefaultCohereBaseUrl,
  sambanova: getDefaultSambanovaBaseUrl,
  mistral: getDefaultMistralBaseUrl,
  longcat: getDefaultLongcatBaseUrl,
  anthropic: getDefaultAnthropicBaseUrl,
  vercel: getDefaultVercelBaseUrl,
  'open-responses': getDefaultOpenResponsesUrl,
  deepinfra: getDefaultDeepInfraBaseUrl,
  huggingface: getDefaultHuggingFaceBaseUrl,
  alibaba: getDefaultAlibabaBaseUrl,
  'amazon-bedrock': getDefaultAmazonBedrockBaseUrl,
  'azure-openai': getDefaultAzureOpenAIBaseUrl,
  baseten: getDefaultBasetenBaseUrl,
  'nvidia-nim': getDefaultNvidiaNimBaseUrl,
  clarifai: getDefaultClarifaiBaseUrl,
  heroku: getDefaultHerokuBaseUrl,
  'lm-studio': getDefaultLmStudioBaseUrl,
  modelscope: getDefaultModelScopeBaseUrl,
  modal: getDefaultModalBaseUrl,
  openadapter: getDefaultOpenAdapterBaseUrl,
  opencode: getDefaultOpenCodeBaseUrl,
  xai: getDefaultXaiBaseUrl,
  deepseek: getDefaultDeepSeekBaseUrl,
  minimax: getDefaultMinimaxBaseUrl,
  moonshot: getDefaultMoonshotBaseUrl,
  volcengine: getDefaultVolcengineBaseUrl,
  'xiaomi-mimo': getDefaultXiaomiMimoBaseUrl,
  stepfun: getDefaultStepFunBaseUrl,
  mulerouter: getDefaultMuleRouterBaseUrl,
  glm: getDefaultGlmBaseUrl,
  'openai-compatible': getDefaultOpenAICompatibleBaseUrl,
};

const providerRegionalBaseUrlResolvers: Partial<Record<ProviderId, (r: ProviderRegion) => string>> =
  {
    moonshot: getMoonshotBaseUrlForRegion,
    glm: getGlmBaseUrlForRegion,
    minimax: getMinimaxBaseUrlForRegion,
    stepfun: getStepFunBaseUrlForRegion,
  };

export const resolveDefaultBaseUrlForProvider = (providerId: ProviderId): string | undefined => {
  return providerDefaultBaseUrlResolvers[providerId]?.();
};

export const resolveBaseUrlForProvider = (
  providerId: ProviderId,
  override?: string
): string | undefined => {
  const nextUrl = override?.trim();
  if (nextUrl) return normalizeBaseUrlForProvider(providerId, nextUrl);
  return resolveDefaultBaseUrlForProvider(providerId);
};

export const resolveBaseUrlForRegion = (providerId: ProviderId, region: ProviderRegion): string => {
  return (providerRegionalBaseUrlResolvers[providerId] ?? getMinimaxBaseUrlForRegion)(region);
};
