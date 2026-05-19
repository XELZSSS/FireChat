import type { ProviderId } from '@/shared/types/chat';

export const COMPATIBLE_BUILTIN_PROVIDER_IDS = [
  'poe',
  'modelscope',
  'modal',
  'openai-compatible',
] as const;

export const SDK_STREAM_BUILTIN_PROVIDER_IDS = [
  'google',
  'google-vertex',
  'openrouter',
  'groq',
  'together',
  'fireworks',
  'cerebras',
  'perplexity',
  'cohere',
  'sambanova',
  'mistral',
  'longcat',
  'anthropic',
  'vercel',
  'open-responses',
  'deepinfra',
  'huggingface',
  'alibaba',
  'amazon-bedrock',
  'azure-openai',
  'baseten',
  'nvidia-nim',
  'clarifai',
  'heroku',
  'lm-studio',
  'deepseek',
  'glm',
  'minimax',
  'moonshot',
  'volcengine',
  'xiaomi-mimo',
  'stepfun',
  'mulerouter',
] as const;

export type CompatibleBuiltInProviderId = (typeof COMPATIBLE_BUILTIN_PROVIDER_IDS)[number];
export type SdkStreamBuiltInProviderId = (typeof SDK_STREAM_BUILTIN_PROVIDER_IDS)[number];

const createProviderIdGuard = <T extends readonly string[]>(ids: T) => {
  const idSet = new Set<string>(ids);
  return (providerId: ProviderId): providerId is T[number] => idSet.has(providerId);
};

export const isCompatibleBuiltInProviderId = createProviderIdGuard(COMPATIBLE_BUILTIN_PROVIDER_IDS);

export const isSdkStreamBuiltInProviderId = createProviderIdGuard(SDK_STREAM_BUILTIN_PROVIDER_IDS);
