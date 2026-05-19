import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex/edge';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createMinimaxOpenAI } from 'vercel-minimax-ai-provider';
import { createZhipu } from 'zhipu-ai-provider';
import type { ProviderId } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import { buildProviderOptionsRecord } from '@/infrastructure/providers/aiSdkProviderBase';
import { getProviderDefaults } from '@/infrastructure/providers/config/providerConfig';
import { getProviderResolvedConfig } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import {
  getDefaultDeepSeekBaseUrl,
  getDefaultGoogleBaseUrl,
  getDefaultGoogleVertexBaseUrl,
  getDefaultGlmBaseUrl,
  getDefaultMinimaxBaseUrl,
  getDefaultMoonshotBaseUrl,
  getDefaultVolcengineBaseUrl,
  getDefaultXiaomiMimoBaseUrl,
  normalizeBaseUrlForProvider,
} from '@/infrastructure/providers/config/baseUrl';
import {
  fetchGoogleGenerativeAIModels,
  fetchGoogleVertexModels,
  fetchOpenAIStyleModels,
} from '@/infrastructure/providers/modelDiscovery';
import {
  buildDeepSeekReasoningOptions,
  buildMoonshotReasoningOptions,
  supportsDeepSeekReasoningControl,
  supportsGlmReasoningControl,
  supportsMoonshotReasoningControl,
} from '@/infrastructure/providers/reasoningControl';
import type { ProviderChat } from '@/infrastructure/providers/types';
import { AISdkStreamProvider } from '@/infrastructure/providers/sdkStreamProvider';
import {
  SDK_STREAM_BUILTIN_PROVIDER_IDS,
  isSdkStreamBuiltInProviderId,
  type SdkStreamBuiltInProviderId,
} from '@/infrastructure/providers/builtInProviderGroups';
import {
  createOpenAIStyleSdkProviderFactory,
  toHeaderRecord,
} from '@/infrastructure/providers/sdkStreamProviderFactoryHelpers';
import { createStandardSdkStreamProviderFactories } from '@/infrastructure/providers/builtInSdkStreamStandardProviders';

type DeepSeekSdk = ReturnType<typeof createOpenAICompatible>;
type VolcengineSdk = ReturnType<typeof createOpenAICompatible>;
type XiaomiMimoSdk = ReturnType<typeof createOpenAICompatible>;
type GoogleSdk = ReturnType<typeof createGoogleGenerativeAI>;
type GoogleVertexSdk = ReturnType<typeof createVertex>;
type GlmSdk = ReturnType<typeof createZhipu>;
type MiniMaxSdk = ReturnType<typeof createMinimaxOpenAI>;
type MoonshotSdk = ReturnType<typeof createMoonshotAI>;

const standardOpenAIStyleProviderFactories = createStandardSdkStreamProviderFactories();

const createImageOnlyProvider = (
  providerId: SdkStreamBuiltInProviderId,
  missingApiKeyError: string
): ProviderChat => {
  const defaults = getProviderDefaults(providerId);
  const config = getProviderResolvedConfig(providerId);

  return new AISdkStreamProvider<unknown>({
    id: providerId,
    defaultModel: defaults.defaultModel,
    defaultApiKey: defaults.defaultApiKey,
    getDefaultBaseUrl: () => defaults.defaultBaseUrl,
    normalizeBaseUrl: (value) => normalizeBaseUrlForProvider(providerId, value),
    missingApiKeyError,
    logLabel: config.label,

    supportsBaseUrl: config.capabilities.supportsBaseUrl,
    supportsCustomHeaders: config.capabilities.supportsCustomHeaders,
    createSdkProvider: () => ({}),
    createModel: () => {
      throw new Error(`${config.label} only supports image generation.`);
    },
    listModels: async () => [],
  });
};

const createGoogleProvider = (): ProviderChat =>
  createOpenAIStyleSdkProviderFactory<GoogleSdk>({
    providerId: 'google',
    getDefaultBaseUrl: getDefaultGoogleBaseUrl,
    normalizeBaseUrl: (value) => value.replace(/\/+$/, ''),
    missingApiKeyError: t('settings.provider.error.google.missingApiKey'),
    createSdkProvider: ({ apiKey, baseUrl, fetch }) =>
      createGoogleGenerativeAI({
        apiKey,
        baseURL: baseUrl,
        fetch,
      }),
    listModels: ({ apiKey, baseUrl, fetch }) =>
      fetchGoogleGenerativeAIModels({
        apiKey,
        baseUrl,
        fetcher: fetch,
      }),
  });

const createGoogleVertexProvider = (): ProviderChat =>
  createOpenAIStyleSdkProviderFactory<GoogleVertexSdk>({
    providerId: 'google-vertex',
    getDefaultBaseUrl: getDefaultGoogleVertexBaseUrl,
    normalizeBaseUrl: (value) => value.replace(/\/+$/, ''),
    missingApiKeyError: t('settings.provider.error.googleVertex.missingApiKey'),
    createSdkProvider: ({ apiKey, baseUrl, fetch, customHeaders }) =>
      createVertex({
        apiKey,
        baseURL: baseUrl,
        fetch,
        headers: toHeaderRecord(customHeaders),
      }),
    listModels: ({ apiKey, baseUrl, customHeaders, fetch }) =>
      fetchGoogleVertexModels({
        apiKey,
        baseUrl,
        customHeaders,
        fetcher: fetch,
      }).then((items) => items.filter((item) => item.id.toLowerCase().includes('gemini'))),
  });

const createDeepSeekProvider = (): ProviderChat =>
  createOpenAIStyleSdkProviderFactory<DeepSeekSdk>({
    providerId: 'deepseek',
    getDefaultBaseUrl: getDefaultDeepSeekBaseUrl,
    missingApiKeyError: 'Missing DEEPSEEK_API_KEY',
    createSdkProvider: ({ apiKey, baseUrl, fetch, customHeaders }) =>
      createOpenAICompatible({
        name: 'deepseek',
        apiKey,
        baseURL: baseUrl ?? getDefaultDeepSeekBaseUrl(),
        fetch,
        headers: toHeaderRecord(customHeaders),
      }),
    buildProviderOptions: ({ requestModelName, emitReasoning, reasoningPreference }) =>
      buildProviderOptionsRecord(
        ['openaiCompatible', 'deepseek'],
        supportsDeepSeekReasoningControl(requestModelName)
          ? buildDeepSeekReasoningOptions(requestModelName, {
              enabled: emitReasoning,
              level: reasoningPreference.level,
            })
          : undefined
      ),
    listModels: ({ apiKey, baseUrl, customHeaders, fetch }) =>
      fetchOpenAIStyleModels({
        baseUrl,
        apiKey,
        customHeaders,
        fetcher: fetch,
      }),
  });

const createVolcengineProvider = (): ProviderChat =>
  createOpenAIStyleSdkProviderFactory<VolcengineSdk>({
    providerId: 'volcengine',
    getDefaultBaseUrl: getDefaultVolcengineBaseUrl,
    missingApiKeyError: 'Missing VOLCENGINE_API_KEY',
    createSdkProvider: ({ apiKey, baseUrl, fetch, customHeaders }) =>
      createOpenAICompatible({
        name: 'volcengine',
        apiKey,
        baseURL: baseUrl ?? getDefaultVolcengineBaseUrl(),
        fetch,
        headers: toHeaderRecord(customHeaders),
      }),
    listModels: ({ apiKey, baseUrl, customHeaders, fetch }) =>
      fetchOpenAIStyleModels({
        baseUrl,
        apiKey,
        customHeaders,
        fetcher: fetch,
      }),
  });

const createXiaomiMimoProvider = (): ProviderChat =>
  createOpenAIStyleSdkProviderFactory<XiaomiMimoSdk>({
    providerId: 'xiaomi-mimo',
    getDefaultBaseUrl: getDefaultXiaomiMimoBaseUrl,
    missingApiKeyError: 'Missing XIAOMI_API_KEY',
    createSdkProvider: ({ apiKey, baseUrl, fetch, customHeaders }) =>
      createOpenAICompatible({
        name: 'xiaomi-mimo',
        apiKey,
        baseURL: baseUrl ?? getDefaultXiaomiMimoBaseUrl(),
        fetch,
        headers: toHeaderRecord(customHeaders),
      }),
    listModels: ({ apiKey, baseUrl, customHeaders, fetch }) =>
      fetchOpenAIStyleModels({
        baseUrl,
        apiKey,
        customHeaders,
        fetcher: fetch,
      }),
  });

const createGlmProvider = (): ProviderChat =>
  createOpenAIStyleSdkProviderFactory<GlmSdk>({
    providerId: 'glm',
    getDefaultBaseUrl: getDefaultGlmBaseUrl,
    normalizeBaseUrl: (value) => normalizeBaseUrlForProvider('glm', value),
    missingApiKeyError: t('settings.provider.error.glm.missingApiKey'),
    createSdkProvider: ({ apiKey, baseUrl, fetch }) =>
      createZhipu({
        apiKey,
        baseURL: baseUrl,
        fetch,
      }),
    createModel: ({ provider, requestModelName, emitReasoning }) =>
      provider(
        requestModelName,
        supportsGlmReasoningControl(requestModelName)
          ? {
              thinking: emitReasoning
                ? {
                    type: 'enabled',
                    clearThinking: false,
                  }
                : {
                    type: 'disabled',
                  },
            }
          : undefined
      ),
    listModels: ({ apiKey, baseUrl, customHeaders, fetch }) =>
      fetchOpenAIStyleModels({
        baseUrl,
        apiKey,
        customHeaders,
        fetcher: fetch,
      }),
  });

const createMinimaxProvider = (): ProviderChat =>
  createOpenAIStyleSdkProviderFactory<MiniMaxSdk>({
    providerId: 'minimax',
    getDefaultBaseUrl: getDefaultMinimaxBaseUrl,
    missingApiKeyError: 'Missing MINIMAX_API_KEY',
    createSdkProvider: ({ apiKey, baseUrl, fetch }) =>
      createMinimaxOpenAI({
        apiKey,
        baseURL: baseUrl,
        fetch,
      }),
    listModels: ({ apiKey, baseUrl, customHeaders, fetch }) =>
      fetchOpenAIStyleModels({
        baseUrl,
        apiKey,
        customHeaders,
        fetcher: fetch,
      }),
  });

const createMoonshotProvider = (): ProviderChat =>
  createOpenAIStyleSdkProviderFactory<MoonshotSdk>({
    providerId: 'moonshot',
    getDefaultBaseUrl: getDefaultMoonshotBaseUrl,
    missingApiKeyError: 'Missing MOONSHOT_API_KEY',
    createSdkProvider: ({ apiKey, baseUrl, fetch }) =>
      createMoonshotAI({
        apiKey,
        baseURL: baseUrl,
        fetch,
      }),
    buildProviderOptions: ({ requestModelName, emitReasoning }) =>
      buildProviderOptionsRecord(
        ['moonshotai'],
        supportsMoonshotReasoningControl(requestModelName)
          ? buildMoonshotReasoningOptions(emitReasoning)
          : undefined
      ),
    listModels: ({ apiKey, baseUrl, customHeaders, fetch }) =>
      fetchOpenAIStyleModels({
        baseUrl,
        apiKey,
        customHeaders,
        fetcher: fetch,
      }),
  });

const sdkStreamProviderFactories: Record<SdkStreamBuiltInProviderId, () => ProviderChat> = {
  google: createGoogleProvider,
  'google-vertex': createGoogleVertexProvider,
  openrouter: standardOpenAIStyleProviderFactories.openrouter!,
  groq: standardOpenAIStyleProviderFactories.groq!,
  together: standardOpenAIStyleProviderFactories.together!,
  fireworks: standardOpenAIStyleProviderFactories.fireworks!,
  cerebras: standardOpenAIStyleProviderFactories.cerebras!,
  perplexity: standardOpenAIStyleProviderFactories.perplexity!,
  cohere: standardOpenAIStyleProviderFactories.cohere!,
  sambanova: standardOpenAIStyleProviderFactories.sambanova!,
  mistral: standardOpenAIStyleProviderFactories.mistral!,
  longcat: standardOpenAIStyleProviderFactories.longcat!,
  anthropic: standardOpenAIStyleProviderFactories.anthropic!,
  vercel: standardOpenAIStyleProviderFactories.vercel!,
  'open-responses': standardOpenAIStyleProviderFactories['open-responses']!,
  deepinfra: standardOpenAIStyleProviderFactories.deepinfra!,
  huggingface: standardOpenAIStyleProviderFactories.huggingface!,
  alibaba: standardOpenAIStyleProviderFactories.alibaba!,
  'amazon-bedrock': standardOpenAIStyleProviderFactories['amazon-bedrock']!,
  'azure-openai': standardOpenAIStyleProviderFactories['azure-openai']!,
  baseten: standardOpenAIStyleProviderFactories.baseten!,
  'nvidia-nim': standardOpenAIStyleProviderFactories['nvidia-nim']!,
  clarifai: standardOpenAIStyleProviderFactories.clarifai!,
  heroku: standardOpenAIStyleProviderFactories.heroku!,
  'lm-studio': standardOpenAIStyleProviderFactories['lm-studio']!,
  fal: () => createImageOnlyProvider('fal', 'Missing FAL_API_KEY'),
  replicate: () => createImageOnlyProvider('replicate', 'Missing REPLICATE_API_TOKEN'),
  'black-forest-labs': () =>
    createImageOnlyProvider('black-forest-labs', 'Missing BFL_API_KEY'),
  prodia: () => createImageOnlyProvider('prodia', 'Missing PRODIA_API_KEY'),
  'luma-ai': () => createImageOnlyProvider('luma-ai', 'Missing LUMA_API_KEY'),
  deepseek: createDeepSeekProvider,
  glm: createGlmProvider,
  minimax: createMinimaxProvider,
  moonshot: createMoonshotProvider,
  volcengine: createVolcengineProvider,
  'xiaomi-mimo': createXiaomiMimoProvider,
  stepfun: standardOpenAIStyleProviderFactories.stepfun!,
  mulerouter: standardOpenAIStyleProviderFactories.mulerouter!,
};

export const createSdkStreamBuiltInProviderInstance = (providerId: ProviderId): ProviderChat => {
  if (!isSdkStreamBuiltInProviderId(providerId)) {
    throw new Error(
      `Provider ${providerId} is not an AI SDK stream built-in provider. Supported: ${SDK_STREAM_BUILTIN_PROVIDER_IDS.join(', ')}`
    );
  }

  return sdkStreamProviderFactories[providerId]();
};
