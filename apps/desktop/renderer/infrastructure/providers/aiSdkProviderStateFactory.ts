import type { ProviderId } from '@/shared/types/chat';
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
  baseUrl?: string;
  defaultApiKey?: string;
  missingApiKeyError?: string;
  supportsBaseUrl: boolean;
  supportsCustomHeaders: boolean;
  providerName: string;
};

export type ProviderRuntimeState = {
  id: ProviderId;
  modelName: string;
  providerName: string;
  supportsCustomHeaders: boolean;
  customHeaders: HeaderPair[];
};

export type ProviderStateChangeKind =
  | 'modelName'
  | 'systemPrompt'
  | 'apiKey'
  | 'baseUrl'
  | 'customHeaders'
  | 'reasoningPreference';

export const createSharedProviderBaseState = (
  options: SharedProviderBaseOptions
): SharedProviderBaseState => ({
  id: options.id,
  logLabel: options.logLabel,
  apiKey: options.defaultApiKey,
  modelName: options.defaultModel,
  baseUrl: options.defaultBaseUrl,
  defaultApiKey: options.defaultApiKey,
  missingApiKeyError: options.missingApiKeyError,
  supportsBaseUrl: options.supportsBaseUrl ?? false,
  supportsCustomHeaders: options.supportsCustomHeaders ?? false,
  providerName: options.providerName ?? options.id,
});

export const createProviderRuntimeState = ({
  id,
  modelName,
  providerName,
  supportsCustomHeaders,
  customHeaders,
}: ProviderRuntimeState) => ({
  id,
  modelName,
  providerName,
  customHeaders: supportsCustomHeaders ? normalizeHeaderRecord(customHeaders) : {},
});

export const toDefinedOptions = (
  options: Record<string, unknown>
): Record<string, unknown> | undefined => {
  return Object.keys(options).length > 0 ? options : undefined;
};
