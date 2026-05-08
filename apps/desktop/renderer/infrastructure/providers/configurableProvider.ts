import type { ChatPromptInput, ProviderId } from '@/shared/types/chat';
import {
  AISdkOpenAICompatibleProviderBase,
  AISdkOpenAIResponsesProviderBase,
} from '@/infrastructure/providers/aiSdkProviderBase';
import { fetchOpenAIStyleModels } from '@/infrastructure/providers/modelDiscovery';
import { buildOpenAIReasoningOptions } from '@/infrastructure/providers/reasoningControl';
import { getProviderResolvedConfig } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import type { ProviderChat } from '@/infrastructure/providers/types';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';

const createMissingApiKeyMessage = (label: string): string => `Missing API key for ${label}.`;

const createMissingBaseUrlMessage = (label: string): string => `Missing base URL for ${label}.`;

class ConfigurableOpenAICompatibleProvider
  extends AISdkOpenAICompatibleProviderBase
  implements ProviderChat
{
  constructor(private readonly providerId: ProviderId) {
    const config = getProviderResolvedConfig(providerId);
    super({
      id: providerId,
      defaultModel: config.defaultModel,
      defaultApiKey: config.defaultApiKey,
      defaultBaseUrl: config.defaultBaseUrl,
      missingApiKeyError: createMissingApiKeyMessage(config.label),
      missingBaseUrlError: createMissingBaseUrlMessage(config.label),
      logLabel: config.label,
      supportsTavily: config.capabilities.supportsTavily,
      supportsBaseUrl: config.capabilities.supportsBaseUrl,
      supportsCustomHeaders: config.capabilities.supportsCustomHeaders,
      providerName: providerId,
    });

    this.setCustomHeaders(config.defaultCustomHeaders);
  }

  protected override resolveBaseUrl(baseUrl?: string): string | undefined {
    const trimmed = baseUrl?.trim();
    return trimmed
      ? trimmed.replace(/\/+$/, '')
      : getProviderResolvedConfig(this.providerId).defaultBaseUrl;
  }

  override async listModels() {
    const baseUrl = this.resolveTransportBaseUrl(this.getBaseUrl());
    if (!baseUrl) {
      return [];
    }

    return fetchOpenAIStyleModels({
      baseUrl,
      apiKey: this.resolveApiKey(),
      customHeaders: this.getCustomHeaders?.(),
      fetcher: this.buildRuntimeFetch(),
    });
  }

  async *sendMessageStream(
    message: ChatPromptInput,
    signal?: AbortSignal,
    requestPolicy?: RequestPolicy
  ): AsyncGenerator<string, void, unknown> {
    yield* super.sendMessageStream(message, signal, requestPolicy);
  }
}

class ConfigurableOpenAIResponsesProvider
  extends AISdkOpenAIResponsesProviderBase
  implements ProviderChat
{
  private previousResponseId?: string;

  constructor(private readonly providerId: ProviderId) {
    const config = getProviderResolvedConfig(providerId);
    super({
      id: providerId,
      defaultModel: config.defaultModel,
      defaultApiKey: config.defaultApiKey,
      defaultBaseUrl: config.defaultBaseUrl,
      missingApiKeyError: createMissingApiKeyMessage(config.label),
      logLabel: config.label,
      supportsTavily: config.capabilities.supportsTavily,
      supportsBaseUrl: config.capabilities.supportsBaseUrl,
      supportsCustomHeaders: config.capabilities.supportsCustomHeaders,
      providerName: providerId,
    });

    this.setCustomHeaders(config.defaultCustomHeaders);
  }

  protected override resolveBaseUrl(baseUrl?: string): string | undefined {
    const trimmed = baseUrl?.trim();
    return trimmed
      ? trimmed.replace(/\/+$/, '')
      : getProviderResolvedConfig(this.providerId).defaultBaseUrl;
  }

  override async listModels() {
    const baseUrl = this.resolveTransportBaseUrl(this.getBaseUrl());
    if (!baseUrl) {
      return [];
    }

    return fetchOpenAIStyleModels({
      baseUrl,
      apiKey: this.resolveApiKey(),
      customHeaders: this.getCustomHeaders?.(),
      fetcher: this.buildRuntimeFetch(),
    });
  }

  protected override buildResponsesProviderOptions({
    modelName,
    emitReasoning,
    requestPolicy,
    previousResponseId,
  }: {
    modelName: string;
    emitReasoning: boolean;
    requestPolicy?: RequestPolicy;
    previousResponseId?: string;
  }): Record<string, unknown> | undefined {
    const options: Record<string, unknown> = {
      ...(super.buildResponsesProviderOptions({
        providerName: this.providerId,
        modelName,
        emitReasoning,
        requestPolicy,
        previousResponseId,
      }) ?? {}),
    };

    Object.assign(
      options,
      buildOpenAIReasoningOptions(modelName, {
        enabled: emitReasoning,
        level: this.reasoningPreference.level,
      }) ?? {}
    );

    if (previousResponseId) {
      options.previousResponseId = previousResponseId;
    }

    return Object.keys(options).length > 0 ? options : undefined;
  }

  protected override getPreviousResponseId(): string | undefined {
    return this.previousResponseId;
  }

  protected override setPreviousResponseId(responseId?: string): void {
    this.previousResponseId = responseId;
  }

  protected override shouldUsePreviousResponseId(): boolean {
    return true;
  }

  async *sendMessageStream(
    message: ChatPromptInput,
    signal?: AbortSignal,
    requestPolicy?: RequestPolicy
  ): AsyncGenerator<string, void, unknown> {
    yield* super.sendMessageStream(message, signal, requestPolicy);
  }
}

export const createConfigurableProviderInstance = (providerId: ProviderId): ProviderChat => {
  const config = getProviderResolvedConfig(providerId);
  return config.transport === 'openai'
    ? new ConfigurableOpenAIResponsesProvider(providerId)
    : new ConfigurableOpenAICompatibleProvider(providerId);
};
