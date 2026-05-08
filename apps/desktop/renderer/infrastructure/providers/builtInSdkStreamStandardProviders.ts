import { createAlibaba } from '@ai-sdk/alibaba';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createAzure } from '@ai-sdk/azure';
import { createCerebras } from '@ai-sdk/cerebras';
import { createCohere } from '@ai-sdk/cohere';
import { createDeepInfra } from '@ai-sdk/deepinfra';
import { createFireworks } from '@ai-sdk/fireworks';
import { createGroq } from '@ai-sdk/groq';
import { createHuggingFace } from '@ai-sdk/huggingface';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenResponses } from '@ai-sdk/open-responses';
import { createPerplexity } from '@ai-sdk/perplexity';
import { createTogetherAI } from '@ai-sdk/togetherai';
import { createVercel } from '@ai-sdk/vercel';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createLongcat } from 'longcat-ai-sdk-provider';
import { createSambaNova } from 'sambanova-ai-provider';
import { t } from '@/shared/utils/i18n';
import {
  getDefaultCerebrasBaseUrl,
  getDefaultAlibabaBaseUrl,
  getDefaultAnthropicBaseUrl,
  getDefaultAmazonBedrockBaseUrl,
  getDefaultAzureOpenAIBaseUrl,
  getDefaultBasetenBaseUrl,
  getDefaultClarifaiBaseUrl,
  getDefaultCohereBaseUrl,
  getDefaultDeepInfraBaseUrl,
  getDefaultFireworksBaseUrl,
  getDefaultGroqBaseUrl,
  getDefaultHerokuBaseUrl,
  getDefaultHuggingFaceBaseUrl,
  getDefaultLmStudioBaseUrl,
  getDefaultLongcatBaseUrl,
  getDefaultMistralBaseUrl,
  getDefaultMuleRouterBaseUrl,
  getDefaultNvidiaNimBaseUrl,
  getDefaultOpenRouterBaseUrl,
  getDefaultOpenResponsesUrl,
  getDefaultPerplexityBaseUrl,
  getDefaultSambanovaBaseUrl,
  getDefaultStepFunBaseUrl,
  getDefaultTogetherBaseUrl,
  getDefaultVercelBaseUrl,
} from '@/infrastructure/providers/config/baseUrl';
import {
  fetchCohereModels,
  fetchOpenAIStyleModels,
} from '@/infrastructure/providers/modelDiscovery';
import { resolveLongcatModelForReasoning } from '@/infrastructure/providers/reasoningControl';
import type { ProviderChat } from '@/infrastructure/providers/types';
import type { SdkStreamBuiltInProviderId } from '@/infrastructure/providers/builtInProviderGroups';
import {
  createOpenAIStyleSdkProviderFactory,
  getCohereModelsApiBaseUrl,
  normalizeCohereSdkBaseUrl,
  normalizePerplexityBaseUrl,
  toHeaderRecord,
} from '@/infrastructure/providers/sdkStreamProviderFactoryHelpers';

type StandardSdkContext = {
  apiKey: string;
  baseUrl?: string;
  fetch: typeof fetch;
  customHeaders?: Array<{ key: string; value: string }>;
};

type HeaderAwareSdkOptions = {
  apiKey: string;
  baseURL?: string;
  fetch: typeof fetch;
  headers?: Record<string, string>;
};

type StandardOpenAIStyleProviderDefinition = {
  providerId: SdkStreamBuiltInProviderId;
  sdk: (context: StandardSdkContext) => unknown;
  getDefaultBaseUrl: () => string | undefined;
  missingApiKeyError: string;
  normalizeBaseUrl?: (value: string) => string;
  resolveRequestModelName?: (context: { modelName: string; emitReasoning: boolean }) => string;
  listModels?: (context: {
    apiKey: string;
    baseUrl: string;
    fetch: typeof fetch;
    customHeaders?: Array<{ key: string; value: string }>;
  }) => Promise<Awaited<ReturnType<typeof fetchOpenAIStyleModels>>>;
};

const createHeaderAwareSdk =
  <TProvider>(createSdk: (options: HeaderAwareSdkOptions) => TProvider) =>
  ({ apiKey, baseUrl, fetch, customHeaders }: StandardSdkContext): TProvider =>
    createSdk({
      apiKey,
      baseURL: baseUrl,
      fetch,
      headers: toHeaderRecord(customHeaders),
    });

const createOpenAICompatibleSdk =
  (name: string) =>
  ({ apiKey, baseUrl, fetch, customHeaders }: StandardSdkContext) =>
    createOpenAICompatible({
      name,
      apiKey,
      baseURL: baseUrl as string,
      fetch,
      headers: toHeaderRecord(customHeaders),
    });

const createOpenResponsesSdk = ({ apiKey, baseUrl, fetch, customHeaders }: StandardSdkContext) =>
  createOpenResponses({
    name: 'open-responses',
    url: baseUrl as string,
    apiKey,
    fetch,
    headers: toHeaderRecord(customHeaders),
  });

const createStandardOpenAIStyleProvider = ({
  providerId,
  sdk,
  getDefaultBaseUrl,
  missingApiKeyError,
  normalizeBaseUrl,
  resolveRequestModelName,
  listModels,
}: StandardOpenAIStyleProviderDefinition): ProviderChat =>
  createOpenAIStyleSdkProviderFactory<unknown>({
    providerId,
    getDefaultBaseUrl,
    normalizeBaseUrl,
    missingApiKeyError,
    resolveRequestModelName,
    createSdkProvider: ({ apiKey, baseUrl, fetch, customHeaders }) =>
      sdk({
        apiKey,
        baseUrl,
        fetch,
        customHeaders,
      }),
    listModels:
      listModels ??
      (({ apiKey, baseUrl, customHeaders, fetch }) =>
        fetchOpenAIStyleModels({
          baseUrl,
          apiKey,
          customHeaders,
          fetcher: fetch,
        })),
  });

const STANDARD_OPENAI_STYLE_PROVIDER_DEFINITIONS = [
  {
    providerId: 'groq',
    getDefaultBaseUrl: getDefaultGroqBaseUrl,
    missingApiKeyError: t('settings.provider.error.groq.missingApiKey'),
    sdk: createHeaderAwareSdk(createGroq),
  },
  {
    providerId: 'openrouter',
    getDefaultBaseUrl: getDefaultOpenRouterBaseUrl,
    missingApiKeyError: t('settings.provider.error.openrouter.missingApiKey'),
    sdk: createHeaderAwareSdk(createOpenRouter),
  },
  {
    providerId: 'together',
    getDefaultBaseUrl: getDefaultTogetherBaseUrl,
    missingApiKeyError: t('settings.provider.error.together.missingApiKey'),
    sdk: createHeaderAwareSdk(createTogetherAI),
  },
  {
    providerId: 'fireworks',
    getDefaultBaseUrl: getDefaultFireworksBaseUrl,
    missingApiKeyError: t('settings.provider.error.fireworks.missingApiKey'),
    sdk: createHeaderAwareSdk(createFireworks),
  },
  {
    providerId: 'cerebras',
    getDefaultBaseUrl: getDefaultCerebrasBaseUrl,
    missingApiKeyError: t('settings.provider.error.cerebras.missingApiKey'),
    sdk: createHeaderAwareSdk(createCerebras),
  },
  {
    providerId: 'perplexity',
    getDefaultBaseUrl: getDefaultPerplexityBaseUrl,
    normalizeBaseUrl: normalizePerplexityBaseUrl,
    missingApiKeyError: t('settings.provider.error.perplexity.missingApiKey'),
    sdk: createHeaderAwareSdk(createPerplexity),
    listModels: ({ apiKey, baseUrl, customHeaders, fetch }) =>
      fetchOpenAIStyleModels({
        baseUrl: `${baseUrl.replace(/\/+$/, '')}/v1`,
        apiKey,
        customHeaders,
        fetcher: fetch,
      }),
  },
  {
    providerId: 'cohere',
    getDefaultBaseUrl: getDefaultCohereBaseUrl,
    normalizeBaseUrl: normalizeCohereSdkBaseUrl,
    missingApiKeyError: t('settings.provider.error.cohere.missingApiKey'),
    sdk: createHeaderAwareSdk(createCohere),
    listModels: ({ apiKey, baseUrl, fetch }) =>
      fetchCohereModels({
        apiKey,
        baseUrl: getCohereModelsApiBaseUrl(baseUrl),
        fetcher: fetch,
      }),
  },
  {
    providerId: 'sambanova',
    getDefaultBaseUrl: getDefaultSambanovaBaseUrl,
    missingApiKeyError: t('settings.provider.error.sambanova.missingApiKey'),
    sdk: createHeaderAwareSdk(createSambaNova),
  },
  {
    providerId: 'mistral',
    getDefaultBaseUrl: getDefaultMistralBaseUrl,
    missingApiKeyError: t('settings.provider.error.mistral.missingApiKey'),
    sdk: createHeaderAwareSdk(createMistral),
  },
  {
    providerId: 'longcat',
    getDefaultBaseUrl: getDefaultLongcatBaseUrl,
    missingApiKeyError: t('settings.provider.error.longcat.missingApiKey'),
    sdk: createHeaderAwareSdk(createLongcat),
    resolveRequestModelName: ({ modelName, emitReasoning }) =>
      resolveLongcatModelForReasoning(modelName, emitReasoning),
  },
  {
    providerId: 'anthropic',
    getDefaultBaseUrl: getDefaultAnthropicBaseUrl,
    missingApiKeyError: 'Missing ANTHROPIC_API_KEY',
    sdk: createHeaderAwareSdk(createAnthropic),
    listModels: async () => [],
  },
  {
    providerId: 'vercel',
    getDefaultBaseUrl: getDefaultVercelBaseUrl,
    missingApiKeyError: 'Missing VERCEL_API_KEY',
    sdk: createHeaderAwareSdk(createVercel),
    listModels: async () => [],
  },
  {
    providerId: 'open-responses',
    getDefaultBaseUrl: getDefaultOpenResponsesUrl,
    missingApiKeyError: 'Missing OPEN_RESPONSES_API_KEY',
    sdk: createOpenResponsesSdk,
    listModels: async () => [],
  },
  {
    providerId: 'deepinfra',
    getDefaultBaseUrl: getDefaultDeepInfraBaseUrl,
    missingApiKeyError: 'Missing DEEPINFRA_API_KEY',
    sdk: createHeaderAwareSdk(createDeepInfra),
  },
  {
    providerId: 'huggingface',
    getDefaultBaseUrl: getDefaultHuggingFaceBaseUrl,
    missingApiKeyError: 'Missing HUGGINGFACE_API_KEY',
    sdk: createHeaderAwareSdk(createHuggingFace),
  },
  {
    providerId: 'alibaba',
    getDefaultBaseUrl: getDefaultAlibabaBaseUrl,
    missingApiKeyError: 'Missing ALIBABA_API_KEY',
    sdk: createHeaderAwareSdk(createAlibaba),
  },
  {
    providerId: 'amazon-bedrock',
    getDefaultBaseUrl: getDefaultAmazonBedrockBaseUrl,
    missingApiKeyError: 'Missing AMAZON_BEDROCK_API_KEY',
    sdk: createHeaderAwareSdk(createAmazonBedrock),
    listModels: async () => [],
  },
  {
    providerId: 'azure-openai',
    getDefaultBaseUrl: getDefaultAzureOpenAIBaseUrl,
    missingApiKeyError: 'Missing AZURE_OPENAI_API_KEY',
    sdk: createHeaderAwareSdk(createAzure),
    listModels: async () => [],
  },
  {
    providerId: 'baseten',
    getDefaultBaseUrl: getDefaultBasetenBaseUrl,
    missingApiKeyError: 'Missing BASETEN_API_KEY',
    sdk: createOpenAICompatibleSdk('baseten'),
    listModels: async () => [],
  },
  {
    providerId: 'nvidia-nim',
    getDefaultBaseUrl: getDefaultNvidiaNimBaseUrl,
    missingApiKeyError: 'Missing NVIDIA_NIM_API_KEY',
    sdk: createOpenAICompatibleSdk('nvidia-nim'),
  },
  {
    providerId: 'clarifai',
    getDefaultBaseUrl: getDefaultClarifaiBaseUrl,
    missingApiKeyError: 'Missing CLARIFAI_API_KEY',
    sdk: createOpenAICompatibleSdk('clarifai'),
  },
  {
    providerId: 'heroku',
    getDefaultBaseUrl: getDefaultHerokuBaseUrl,
    missingApiKeyError: 'Missing HEROKU_API_KEY',
    sdk: createOpenAICompatibleSdk('heroku'),
  },
  {
    providerId: 'lm-studio',
    getDefaultBaseUrl: getDefaultLmStudioBaseUrl,
    missingApiKeyError: 'Missing LM_STUDIO_API_KEY',
    sdk: createOpenAICompatibleSdk('lm-studio'),
  },
  {
    providerId: 'stepfun',
    getDefaultBaseUrl: getDefaultStepFunBaseUrl,
    missingApiKeyError: 'Missing STEPFUN_API_KEY',
    sdk: createOpenAICompatibleSdk('stepfun'),
  },
  {
    providerId: 'mulerouter',
    getDefaultBaseUrl: getDefaultMuleRouterBaseUrl,
    missingApiKeyError: 'Missing MULEROUTER_API_KEY',
    sdk: createOpenAICompatibleSdk('mulerouter'),
  },
] as const satisfies readonly StandardOpenAIStyleProviderDefinition[];

export const createStandardSdkStreamProviderFactories = (): Partial<
  Record<SdkStreamBuiltInProviderId, () => ProviderChat>
> =>
  Object.fromEntries(
    STANDARD_OPENAI_STYLE_PROVIDER_DEFINITIONS.map((definition) => [
      definition.providerId,
      () => createStandardOpenAIStyleProvider(definition),
    ])
  ) as Partial<Record<SdkStreamBuiltInProviderId, () => ProviderChat>>;
