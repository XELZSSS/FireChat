import type { ProviderConfigEntry } from '@contracts/provider-config';
import { PROVIDER_IDS as BUILTIN_PROVIDER_IDS } from '../../../../../shared/provider-ids';
import type { ProviderId } from '@/shared/types/chat';
import {
  PROVIDER_MANIFEST,
  type ProviderManifestEntry,
} from '@/infrastructure/providers/config/providerManifest';
import { buildProviderModelConfig } from '@/infrastructure/providers/config/modelConfig';
import { getProviderFileSnapshot } from '@/infrastructure/providers/runtime/providerFileSnapshot';
import type { ProviderResolvedConfig } from '@/infrastructure/providers/runtime/providerRuntimeTypes';
import {
  EMPTY_FILE_ENTRY,
  getCustomCapabilities,
  getCustomDefaultIcon,
  getCustomDefaultModel,
  getCustomProviderLabel,
  listConfiguredModelIds,
  toHeaderPairs,
} from '@/infrastructure/providers/runtime/providerRuntimeShared';

const resolveBuiltInProviderConfig = (
  providerId: (typeof BUILTIN_PROVIDER_IDS)[number],
  entry: ProviderManifestEntry,
  override: ProviderConfigEntry,
  authEntry?: { apiKey?: string; headers?: Record<string, string> }
): ProviderResolvedConfig | null => {
  if (override.enabled === false) {
    return null;
  }

  const configuredModels = override.models ?? {};
  const { defaultModel, models } = buildProviderModelConfig({
    ...entry.modelSpec,
    envModel: override.defaultModel?.trim() || entry.modelSpec.envModel,
  });
  const configuredModelIds = listConfiguredModelIds(configuredModels);

  return {
    ...entry,
    id: providerId,
    source: 'builtin',
    transport: providerId,
    label: override.label?.trim() || entry.label,
    icon: override.icon?.trim() || providerId,
    defaultModel,
    models: configuredModelIds.length > 0 ? configuredModelIds : models,
    defaultApiKey: authEntry?.apiKey?.trim() || entry.envApiKeyResolver(),
    defaultBaseUrl: override.options?.baseURL?.trim(),
    defaultRequestMode: override.options?.requestMode,
    defaultSystemPrompt: override.options?.systemPrompt?.trim(),
    defaultCustomHeaders: toHeaderPairs(authEntry?.headers),
    configuredModels,
  };
};

const resolveCustomProviderConfig = (
  providerId: string,
  entry: ProviderConfigEntry,
  authEntry?: { apiKey?: string; headers?: Record<string, string> }
): ProviderResolvedConfig | null => {
  if (entry.enabled === false) {
    return null;
  }

  const transport = entry.transport;
  if (transport !== 'openai' && transport !== 'openai-compatible') {
    return null;
  }

  const configuredModels = entry.models ?? {};
  const defaultModel =
    entry.defaultModel?.trim() ||
    Object.keys(configuredModels).find((modelId) => modelId.trim().length > 0) ||
    getCustomDefaultModel(transport);
  const models = listConfiguredModelIds(configuredModels);

  return {
    id: providerId,
    source: 'custom',
    transport,
    label: getCustomProviderLabel(providerId, entry),
    isOfficialProvider: false,
    capabilities: getCustomCapabilities(transport),
    modelSpec: {
      defaultModelId: defaultModel,
      includeDefaultModelId: true,
    },
    defaultModel,
    models: models.length > 0 ? models : [defaultModel],
    defaultApiKey: authEntry?.apiKey?.trim() || undefined,
    defaultBaseUrl: entry.options?.baseURL?.trim(),
    defaultRequestMode: entry.options?.requestMode,
    defaultSystemPrompt: entry.options?.systemPrompt?.trim(),
    defaultCustomHeaders: toHeaderPairs(authEntry?.headers),
    configuredModels,
    envApiKeyResolver: () => undefined,
    icon: entry.icon?.trim() || getCustomDefaultIcon(transport),
  };
};

export const buildRuntimeProviderConfigs = (): Record<ProviderId, ProviderResolvedConfig> => {
  const snapshot = getProviderFileSnapshot();
  const configProviders = snapshot.config.providers ?? {};
  const authProviders = snapshot.auth.providers ?? {};
  const next: Record<ProviderId, ProviderResolvedConfig> = {};

  for (const providerId of BUILTIN_PROVIDER_IDS) {
    const resolved = resolveBuiltInProviderConfig(
      providerId,
      PROVIDER_MANIFEST[providerId],
      configProviders[providerId] ?? EMPTY_FILE_ENTRY,
      authProviders[providerId]
    );

    if (resolved) {
      next[providerId] = resolved;
    }
  }

  for (const [providerId, entry] of Object.entries(configProviders)) {
    if ((BUILTIN_PROVIDER_IDS as readonly string[]).includes(providerId)) {
      continue;
    }

    const resolved = resolveCustomProviderConfig(providerId, entry, authProviders[providerId]);
    if (resolved) {
      next[providerId] = resolved;
    }
  }

  return next;
};
