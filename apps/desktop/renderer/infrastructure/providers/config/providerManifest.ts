import { BUILTIN_PROVIDER_IDS } from '../../../../../shared/provider-ids';
import { getRuntimeEnvValue } from '@/infrastructure/config/runtimeEnv';
import { sanitizeApiKey } from '@/infrastructure/providers/utils';

export type ProviderCapabilities = {
  supportsBaseUrl: boolean;
  supportsCustomHeaders: boolean;
  supportsRegion: boolean;
  supportsReasoningToggle?: boolean;
  supportsRequestMode?: boolean;
};

export type ProviderModelSpec = {
  envModel?: string;
  defaultModelId: string;
  includeDefaultModelId?: boolean;
};

export type ProviderConfig = {
  label: string;
  isOfficialProvider: boolean;
  capabilities: ProviderCapabilities;
  modelSpec: ProviderModelSpec;
  envApiKeyResolver: () => string | undefined;
};

export type ProviderManifestEntry = ProviderConfig;
type BuiltInProviderId = (typeof BUILTIN_PROVIDER_IDS)[number];

const STANDARD_PROVIDER_CAPABILITIES = {
  supportsBaseUrl: false,
  supportsCustomHeaders: false,
  supportsRegion: false,
} as const satisfies ProviderCapabilities;

const createProviderCapabilities = (
  overrides: Partial<ProviderCapabilities>
): ProviderCapabilities => ({
  ...STANDARD_PROVIDER_CAPABILITIES,
  ...overrides,
});

const REGIONAL_PROVIDER_CAPABILITIES = createProviderCapabilities({
  supportsBaseUrl: true,
  supportsRegion: true,
});

const BASE_URL_PROVIDER_CAPABILITIES = createProviderCapabilities({ supportsBaseUrl: true });

const OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES = createProviderCapabilities({
  supportsBaseUrl: true,
  supportsCustomHeaders: true,
  supportsReasoningToggle: true,
});

const COMPATIBLE_PROVIDER_CAPABILITIES = createProviderCapabilities({
  supportsBaseUrl: true,
  supportsCustomHeaders: true,
});

const PERPLEXITY_PROVIDER_CAPABILITIES = {
  supportsBaseUrl: true,
  supportsCustomHeaders: true,
  supportsRegion: false,
} as const satisfies ProviderCapabilities;

const OPENADAPTER_PROVIDER_CAPABILITIES = createProviderCapabilities({
  supportsBaseUrl: true,
  supportsReasoningToggle: true,
});

const createProviderManifestEntry = ({
  label,
  isOfficialProvider,
  capabilities,
  envModel,
  defaultModelId,
  envApiKey,
  includeDefaultModelId,
}: {
  label: string;
  isOfficialProvider: boolean;
  capabilities: ProviderCapabilities;
  envModel?: string;
  defaultModelId: string;
  envApiKey?: string;
  includeDefaultModelId?: boolean;
}): ProviderManifestEntry => ({
  label,
  isOfficialProvider,
  capabilities,
  modelSpec: {
    envModel,
    defaultModelId,
    includeDefaultModelId,
  },
  envApiKeyResolver: () => sanitizeApiKey(envApiKey),
});

export const PROVIDER_MANIFEST = {
  openai: createProviderManifestEntry({
    label: 'OpenAI',
    isOfficialProvider: true,
    capabilities: BASE_URL_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('OPENAI_MODEL'),
    defaultModelId: 'gpt-5.5',
    envApiKey: getRuntimeEnvValue('OPENAI_API_KEY'),
  }),
  openrouter: createProviderManifestEntry({
    label: 'OpenRouter',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('OPENROUTER_MODEL'),
    defaultModelId: 'openai/gpt-5.4',
    envApiKey: getRuntimeEnvValue('OPENROUTER_API_KEY'),
  }),
  poe: createProviderManifestEntry({
    label: 'Poe',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('POE_MODEL'),
    defaultModelId: 'Claude-Sonnet-4.6',
    envApiKey: getRuntimeEnvValue('POE_API_KEY'),
  }),
  google: createProviderManifestEntry({
    label: 'Google',
    isOfficialProvider: true,
    capabilities: BASE_URL_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('GOOGLE_GENERATIVE_AI_MODEL'),
    defaultModelId: 'gemini-2.5-flash',
    envApiKey: getRuntimeEnvValue('GOOGLE_GENERATIVE_AI_API_KEY'),
  }),
  'google-vertex': createProviderManifestEntry({
    label: 'Google Vertex AI',
    isOfficialProvider: true,
    capabilities: BASE_URL_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('GOOGLE_VERTEX_MODEL'),
    defaultModelId: 'gemini-2.5-flash',
    envApiKey: getRuntimeEnvValue('GOOGLE_VERTEX_API_KEY'),
  }),
  groq: createProviderManifestEntry({
    label: 'Groq',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('GROQ_MODEL'),
    defaultModelId: 'openai/gpt-oss-20b',
    envApiKey: getRuntimeEnvValue('GROQ_API_KEY'),
  }),
  together: createProviderManifestEntry({
    label: 'Together AI',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('TOGETHER_MODEL'),
    defaultModelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    envApiKey: getRuntimeEnvValue('TOGETHER_API_KEY'),
  }),
  fireworks: createProviderManifestEntry({
    label: 'Fireworks AI',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('FIREWORKS_MODEL'),
    defaultModelId: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
    envApiKey: getRuntimeEnvValue('FIREWORKS_API_KEY'),
  }),
  cerebras: createProviderManifestEntry({
    label: 'Cerebras',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('CEREBRAS_MODEL'),
    defaultModelId: 'gpt-oss-120b',
    envApiKey: getRuntimeEnvValue('CEREBRAS_API_KEY'),
  }),
  perplexity: createProviderManifestEntry({
    label: 'Perplexity',
    isOfficialProvider: true,
    capabilities: PERPLEXITY_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('PERPLEXITY_MODEL'),
    defaultModelId: 'sonar-pro',
    envApiKey: getRuntimeEnvValue('PERPLEXITY_API_KEY'),
  }),
  cohere: createProviderManifestEntry({
    label: 'Cohere',
    isOfficialProvider: true,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('COHERE_MODEL'),
    defaultModelId: 'command-a-03-2025',
    envApiKey: getRuntimeEnvValue('COHERE_API_KEY'),
  }),
  sambanova: createProviderManifestEntry({
    label: 'SambaNova',
    isOfficialProvider: false,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('SAMBANOVA_MODEL'),
    defaultModelId: 'Meta-Llama-3.3-70B-Instruct',
    envApiKey: getRuntimeEnvValue('SAMBANOVA_API_KEY'),
  }),
  mistral: createProviderManifestEntry({
    label: 'Mistral AI',
    isOfficialProvider: true,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('MISTRAL_MODEL'),
    defaultModelId: 'mistral-medium-latest',
    envApiKey: getRuntimeEnvValue('MISTRAL_API_KEY'),
  }),
  longcat: createProviderManifestEntry({
    label: 'LongCat',
    isOfficialProvider: true,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('LONGCAT_MODEL'),
    defaultModelId: 'LongCat-Flash-Chat',
    envApiKey: getRuntimeEnvValue('LONGCAT_API_KEY'),
  }),
  anthropic: createProviderManifestEntry({
    label: 'Anthropic',
    isOfficialProvider: true,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('ANTHROPIC_MODEL'),
    defaultModelId: 'claude-sonnet-4-5',
    envApiKey: getRuntimeEnvValue('ANTHROPIC_API_KEY'),
  }),
  vercel: createProviderManifestEntry({
    label: 'Vercel v0',
    isOfficialProvider: true,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('VERCEL_MODEL'),
    defaultModelId: 'v0-1.5-md',
    envApiKey: getRuntimeEnvValue('VERCEL_API_KEY'),
  }),
  'open-responses': createProviderManifestEntry({
    label: 'Open Responses',
    isOfficialProvider: false,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('OPEN_RESPONSES_MODEL'),
    defaultModelId: 'mistralai/ministral-3-14b-reasoning',
    envApiKey: getRuntimeEnvValue('OPEN_RESPONSES_API_KEY'),
  }),
  deepinfra: createProviderManifestEntry({
    label: 'DeepInfra',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('DEEPINFRA_MODEL'),
    defaultModelId: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    envApiKey: getRuntimeEnvValue('DEEPINFRA_API_KEY'),
  }),
  huggingface: createProviderManifestEntry({
    label: 'Hugging Face',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('HUGGINGFACE_MODEL'),
    defaultModelId: 'meta-llama/Llama-3.1-8B-Instruct',
    envApiKey: getRuntimeEnvValue('HUGGINGFACE_API_KEY'),
  }),
  alibaba: createProviderManifestEntry({
    label: 'Alibaba Cloud',
    isOfficialProvider: true,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('ALIBABA_MODEL'),
    defaultModelId: 'qwen-plus',
    envApiKey: getRuntimeEnvValue('ALIBABA_API_KEY'),
  }),
  'amazon-bedrock': createProviderManifestEntry({
    label: 'Amazon Bedrock',
    isOfficialProvider: false,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('AMAZON_BEDROCK_MODEL'),
    defaultModelId: 'amazon.nova-lite-v1:0',
    envApiKey: getRuntimeEnvValue('AMAZON_BEDROCK_API_KEY'),
  }),
  'azure-openai': createProviderManifestEntry({
    label: 'Azure OpenAI',
    isOfficialProvider: false,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('AZURE_OPENAI_MODEL'),
    defaultModelId: 'gpt-4.1-mini',
    envApiKey: getRuntimeEnvValue('AZURE_OPENAI_API_KEY'),
  }),
  baseten: createProviderManifestEntry({
    label: 'Baseten',
    isOfficialProvider: false,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('BASETEN_MODEL'),
    defaultModelId: 'deepseek-ai/DeepSeek-R1-0528',
    envApiKey: getRuntimeEnvValue('BASETEN_API_KEY'),
  }),
  'nvidia-nim': createProviderManifestEntry({
    label: 'NVIDIA NIM',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('NVIDIA_NIM_MODEL'),
    defaultModelId: 'meta/llama-3.1-8b-instruct',
    envApiKey: getRuntimeEnvValue('NVIDIA_NIM_API_KEY'),
  }),
  clarifai: createProviderManifestEntry({
    label: 'Clarifai',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('CLARIFAI_MODEL'),
    defaultModelId: 'https://clarifai.com/openai/chat-completion/models/gpt-oss-120b',
    envApiKey: getRuntimeEnvValue('CLARIFAI_API_KEY'),
  }),
  heroku: createProviderManifestEntry({
    label: 'Heroku',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('HEROKU_MODEL'),
    defaultModelId: 'gpt-oss-120b',
    envApiKey: getRuntimeEnvValue('HEROKU_API_KEY'),
  }),
  'lm-studio': createProviderManifestEntry({
    label: 'LM Studio',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('LM_STUDIO_MODEL'),
    defaultModelId: 'local-model',
    envApiKey: getRuntimeEnvValue('LM_STUDIO_API_KEY'),
  }),
  modelscope: createProviderManifestEntry({
    label: 'ModelScope',
    isOfficialProvider: false,
    capabilities: OPENADAPTER_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('MODELSCOPE_MODEL'),
    defaultModelId: 'Qwen/Qwen3-8B',
    envApiKey: getRuntimeEnvValue('MODELSCOPE_API_KEY'),
  }),
  modal: createProviderManifestEntry({
    label: 'Modal',
    isOfficialProvider: false,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('MODAL_MODEL'),
    defaultModelId: 'google/gemma-4-26b-a4b-it',
  }),
  openadapter: createProviderManifestEntry({
    label: 'OpenAdapter',
    isOfficialProvider: false,
    capabilities: OPENADAPTER_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('OPENADAPTER_MODEL'),
    defaultModelId: 'DeepSeek-V3',
    envApiKey: getRuntimeEnvValue('OPENADAPTER_API_KEY'),
  }),
  opencode: createProviderManifestEntry({
    label: 'OpenCode',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('OPENCODE_MODEL'),
    defaultModelId: 'gpt-5.5',
    envApiKey: getRuntimeEnvValue('OPENCODE_API_KEY'),
  }),
  'openai-compatible': createProviderManifestEntry({
    label: 'OpenAI-Compatible',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('OPENAI_COMPATIBLE_MODEL'),
    defaultModelId: 'gpt-4.1-mini',
    envApiKey: getRuntimeEnvValue('OPENAI_COMPATIBLE_API_KEY'),
  }),
  xai: createProviderManifestEntry({
    label: 'xAI',
    isOfficialProvider: true,
    capabilities: BASE_URL_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('XAI_MODEL'),
    defaultModelId: 'grok-4-1-fast-reasoning',
    envApiKey: getRuntimeEnvValue('XAI_API_KEY'),
  }),
  deepseek: createProviderManifestEntry({
    label: 'DeepSeek',
    isOfficialProvider: true,
    capabilities: BASE_URL_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('DEEPSEEK_MODEL'),
    defaultModelId: 'deepseek-v4-flash',
    envApiKey: getRuntimeEnvValue('DEEPSEEK_API_KEY'),
  }),
  glm: createProviderManifestEntry({
    label: 'GLM',
    isOfficialProvider: true,
    capabilities: REGIONAL_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('GLM_MODEL'),
    defaultModelId: 'glm-5',
    envApiKey: getRuntimeEnvValue('GLM_API_KEY'),
  }),
  minimax: createProviderManifestEntry({
    label: 'MiniMax',
    isOfficialProvider: true,
    capabilities: REGIONAL_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('MINIMAX_MODEL'),
    defaultModelId: 'MiniMax-M2.5',
    envApiKey: getRuntimeEnvValue('MINIMAX_API_KEY'),
    includeDefaultModelId: false,
  }),
  moonshot: createProviderManifestEntry({
    label: 'Kimi',
    isOfficialProvider: true,
    capabilities: REGIONAL_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('MOONSHOT_MODEL'),
    defaultModelId: 'kimi-k2.6',
    envApiKey: getRuntimeEnvValue('MOONSHOT_API_KEY'),
    includeDefaultModelId: false,
  }),
  volcengine: createProviderManifestEntry({
    label: 'Volcengine',
    isOfficialProvider: true,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('VOLCENGINE_MODEL'),
    defaultModelId: 'doubao-seed-2-0-pro-260215',
    envApiKey: getRuntimeEnvValue('VOLCENGINE_API_KEY'),
  }),
  'xiaomi-mimo': createProviderManifestEntry({
    label: 'Xiaomi MiMo',
    isOfficialProvider: true,
    capabilities: COMPATIBLE_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('XIAOMI_MODEL'),
    defaultModelId: 'xiaomi/mimo-v2-flash',
    envApiKey: getRuntimeEnvValue('XIAOMI_API_KEY'),
  }),
  stepfun: createProviderManifestEntry({
    label: 'StepFun',
    isOfficialProvider: true,
    capabilities: REGIONAL_PROVIDER_CAPABILITIES,
    envModel: getRuntimeEnvValue('STEPFUN_MODEL'),
    defaultModelId: 'step-3.5-flash',
    envApiKey: getRuntimeEnvValue('STEPFUN_API_KEY'),
  }),
  mulerouter: createProviderManifestEntry({
    label: 'MuleRouter',
    isOfficialProvider: false,
    capabilities: OPENAI_COMPATIBLE_CHAT_ONLY_CAPABILITIES,
    envModel: getRuntimeEnvValue('MULEROUTER_MODEL'),
    defaultModelId: 'qwen3-max',
    envApiKey: getRuntimeEnvValue('MULEROUTER_API_KEY'),
  }),
} as const satisfies Record<BuiltInProviderId, ProviderManifestEntry>;
