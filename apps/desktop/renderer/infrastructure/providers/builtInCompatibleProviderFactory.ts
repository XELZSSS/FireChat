import type { ProviderId } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import { proxyFetch } from '@/infrastructure/network/proxyFetch';
import { AISdkOpenAICompatibleProviderBase } from '@/infrastructure/providers/aiSdkProviderBase';
import type { ProviderFetch } from '@/infrastructure/providers/aiSdkProviderState';
import {
  getDefaultModalBaseUrl,
  getDefaultModelScopeBaseUrl,
  getDefaultOpenAICompatibleBaseUrl,
  getDefaultPoeBaseUrl,
  resolveBaseUrl,
} from '@/infrastructure/providers/config/baseUrl';
import { getProviderDefaults } from '@/infrastructure/providers/config/providerConfig';
import { fetchOpenAIStyleModels } from '@/infrastructure/providers/modelDiscovery';
import { getProviderResolvedConfig } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import type { ProviderChat, ProviderModelItem } from '@/infrastructure/providers/types';
import {
  COMPATIBLE_BUILTIN_PROVIDER_IDS,
  isCompatibleBuiltInProviderId,
  type CompatibleBuiltInProviderId,
} from '@/infrastructure/providers/builtInProviderGroups';

type CompatibleProviderDescriptor = {
  getDefaultBaseUrl: () => string | undefined;
  missingApiKeyError?: () => string;
  missingBaseUrlError?: () => string;
  normalizeBaseUrl?: (value: string) => string | undefined;
  buildFetch?: () => ProviderFetch | undefined;
};

const normalizeTrimmedBaseUrl = (value: string): string =>
  resolveBaseUrl(value).replace(/\/+$/, '');

const normalizeModalBaseUrl = (value: string): string => {
  const resolved = normalizeTrimmedBaseUrl(value);
  return resolved.replace(/\/(?:chat\/completions|responses|models)\/?$/i, '');
};

const buildModalFetch = (): ProviderFetch => {
  return (input: RequestInfo | URL, init?: RequestInit) =>
    proxyFetch(
      {
        kind: 'modal',
        url:
          typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
      },
      init
    );
};

const compatibleProviderDescriptors: Record<
  CompatibleBuiltInProviderId,
  CompatibleProviderDescriptor
> = {
  poe: {
    getDefaultBaseUrl: getDefaultPoeBaseUrl,
    missingApiKeyError: () => t('settings.provider.error.poe.missingApiKey'),
  },
  modelscope: {
    getDefaultBaseUrl: getDefaultModelScopeBaseUrl,
    missingApiKeyError: () => t('settings.provider.error.modelscope.missingApiKey'),
    missingBaseUrlError: () => t('settings.provider.error.modelscope.missingBaseUrl'),
    normalizeBaseUrl: normalizeTrimmedBaseUrl,
  },
  modal: {
    getDefaultBaseUrl: getDefaultModalBaseUrl,
    missingBaseUrlError: () => t('settings.provider.error.modal.missingBaseUrl'),
    normalizeBaseUrl: normalizeModalBaseUrl,
    buildFetch: buildModalFetch,
  },
  'openai-compatible': {
    getDefaultBaseUrl: getDefaultOpenAICompatibleBaseUrl,
    missingApiKeyError: () => t('settings.provider.error.openaiCompatible.missingApiKey'),
    missingBaseUrlError: () => t('settings.provider.error.openaiCompatible.missingBaseUrl'),
    normalizeBaseUrl: normalizeTrimmedBaseUrl,
  },
};

class BuiltInCompatibleProvider extends AISdkOpenAICompatibleProviderBase implements ProviderChat {
  private readonly descriptor: CompatibleProviderDescriptor;
  private readonly resolvedDefaultBaseUrl?: string;

  constructor(providerId: CompatibleBuiltInProviderId) {
    const defaults = getProviderDefaults(providerId);
    const config = getProviderResolvedConfig(providerId);
    const descriptor = compatibleProviderDescriptors[providerId];
    const resolvedDefaultBaseUrl = defaults.defaultBaseUrl ?? descriptor.getDefaultBaseUrl();

    super({
      id: providerId,
      defaultModel: defaults.defaultModel,
      defaultApiKey: defaults.defaultApiKey,
      defaultBaseUrl: resolvedDefaultBaseUrl,
      missingApiKeyError: descriptor.missingApiKeyError?.(),
      missingBaseUrlError: descriptor.missingBaseUrlError?.(),
      logLabel: config.label,

      supportsBaseUrl: config.capabilities.supportsBaseUrl,
      supportsCustomHeaders: config.capabilities.supportsCustomHeaders,
      providerName: providerId,
    });

    this.descriptor = descriptor;
    this.resolvedDefaultBaseUrl = resolvedDefaultBaseUrl;
  }

  protected override resolveBaseUrl(baseUrl?: string): string | undefined {
    const raw = baseUrl?.trim() || this.resolvedDefaultBaseUrl?.trim();
    if (!raw) {
      return undefined;
    }

    return (this.descriptor.normalizeBaseUrl ?? resolveBaseUrl)(raw);
  }

  protected override buildFetch(): ProviderFetch | undefined {
    return this.descriptor.buildFetch?.() ?? super.buildFetch();
  }

  override async listModels(): Promise<ProviderModelItem[]> {
    const baseUrl = this.resolveTransportBaseUrl(this.getBaseUrl());
    if (!baseUrl) {
      return [];
    }

    const fetcher = this.buildFetch();
    return fetchOpenAIStyleModels({
      baseUrl,
      apiKey: this.resolveApiKey(),
      customHeaders: this.getCustomHeaders?.(),
      fetcher,
    });
  }
}

export const createCompatibleBuiltInProviderInstance = (providerId: ProviderId): ProviderChat => {
  if (!isCompatibleBuiltInProviderId(providerId)) {
    throw new Error(
      `Provider ${providerId} is not a compatible built-in provider. Supported: ${COMPATIBLE_BUILTIN_PROVIDER_IDS.join(', ')}`
    );
  }

  return new BuiltInCompatibleProvider(providerId);
};
