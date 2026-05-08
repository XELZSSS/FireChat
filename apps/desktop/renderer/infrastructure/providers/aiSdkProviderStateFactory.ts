import type { ProviderId, TavilyConfig } from '@/shared/types/chat';
import { getDefaultImageGenerationSettings } from '@/infrastructure/providers/imageGenerationSettings';
import type { ImageGenerationSettings } from '@/infrastructure/providers/imageGenerationSettings';
import { getDefaultTavilyConfig } from '@/infrastructure/providers/tavily';
import type { ProviderReasoningPreference } from '@/infrastructure/providers/types';
import {
  normalizeHeaderRecord,
  type HeaderPair,
} from '@/infrastructure/providers/aiSdkProviderMessages';

export const DEFAULT_REASONING_PREFERENCE: ProviderReasoningPreference = {
  enabled: false,
  level: 'medium',
};

export type ProviderFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type SharedProviderBaseOptions = {
  id: ProviderId;
  defaultModel: string;
  defaultApiKey?: string;
  missingApiKeyError?: string;
  defaultBaseUrl?: string;
  supportsTavily?: boolean;
  supportsBaseUrl?: boolean;
  supportsCustomHeaders?: boolean;
  logLabel: string;
  providerName?: string;
};

export type SharedProviderBaseState = {
  id: ProviderId;
  logLabel: string;
  apiKey?: string;
  modelName: string;
  imageModelName?: string;
  imageGenerationSettings: ImageGenerationSettings;
  tavilyConfig?: TavilyConfig;
  baseUrl?: string;
  defaultApiKey?: string;
  missingApiKeyError?: string;
  supportsTavily: boolean;
  supportsBaseUrl: boolean;
  supportsCustomHeaders: boolean;
  providerName: string;
};

export type ProviderRuntimeState = {
  id: ProviderId;
  modelName: string;
  providerName: string;
  tavilyConfig?: TavilyConfig;
  supportsTavily: boolean;
  supportsCustomHeaders: boolean;
  customHeaders: HeaderPair[];
};

export type ProviderStateChangeKind =
  | 'modelName'
  | 'systemPrompt'
  | 'apiKey'
  | 'imageModelName'
  | 'imageGenerationSettings'
  | 'baseUrl'
  | 'customHeaders'
  | 'tavilyConfig'
  | 'reasoningPreference';

export const createSharedProviderBaseState = (
  options: SharedProviderBaseOptions
): SharedProviderBaseState => ({
  id: options.id,
  logLabel: options.logLabel,
  apiKey: options.defaultApiKey,
  modelName: options.defaultModel,
  imageGenerationSettings: getDefaultImageGenerationSettings(),
  tavilyConfig: options.supportsTavily === false ? undefined : getDefaultTavilyConfig(),
  baseUrl: options.defaultBaseUrl,
  defaultApiKey: options.defaultApiKey,
  missingApiKeyError: options.missingApiKeyError,
  supportsTavily: options.supportsTavily ?? true,
  supportsBaseUrl: options.supportsBaseUrl ?? false,
  supportsCustomHeaders: options.supportsCustomHeaders ?? false,
  providerName: options.providerName ?? options.id,
});

export const createProviderRuntimeState = ({
  id,
  modelName,
  providerName,
  tavilyConfig,
  supportsTavily,
  supportsCustomHeaders,
  customHeaders,
}: ProviderRuntimeState) => ({
  id,
  modelName,
  providerName,
  tavilyConfig: supportsTavily ? tavilyConfig : undefined,
  customHeaders: supportsCustomHeaders ? normalizeHeaderRecord(customHeaders) : {},
  searchEnabled: false,
  toolSearchEnabled: false,
  hostedSearchEnabled: false,
});

export const toDefinedOptions = (
  options: Record<string, unknown>
): Record<string, unknown> | undefined => {
  return Object.keys(options).length > 0 ? options : undefined;
};
