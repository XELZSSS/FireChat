import type { ProviderConfigModelEntry, ProviderTransport } from '@contracts/provider-config';
import { PROVIDER_IDS as BUILTIN_PROVIDER_IDS } from '../../../../../shared/provider-ids';
import type { ProviderId } from '@/shared/types/chat';
import type { OpenAIRequestMode } from '@/infrastructure/providers/types';
import type {
  ProviderCapabilities,
  ProviderManifestEntry,
} from '@/infrastructure/providers/config/providerManifest';

export type ProviderRuntimeTransport = ProviderTransport | (typeof BUILTIN_PROVIDER_IDS)[number];

export type ProviderResolvedConfig = ProviderManifestEntry & {
  id: ProviderId;
  source: 'builtin' | 'custom';
  transport: ProviderRuntimeTransport;
  icon?: string;
  defaultModel: string;
  models: string[];
  defaultApiKey: string | undefined;
  defaultBaseUrl?: string;
  defaultRequestMode?: OpenAIRequestMode;
  defaultSystemPrompt?: string;
  defaultCustomHeaders: Array<{ key: string; value: string }>;
  configuredModels: Record<string, ProviderConfigModelEntry>;
};

export type ProviderUiMeta = ProviderCapabilities & {
  label: string;
  isOfficialProvider: boolean;
  icon?: string;
  source: 'builtin' | 'custom';
  transport: ProviderRuntimeTransport;
};
