import { ProviderId } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import { getDefaultOpenAIBaseUrl, resolveBaseUrl } from '@/infrastructure/providers/config/baseUrl';
import {
  AISdkOpenAIResponsesProviderBase,
  getSupportsHostedToolSearch,
} from '@/infrastructure/providers/aiSdkProviderBase';
import { fetchOpenAIStyleModels } from '@/infrastructure/providers/modelDiscovery';
import { buildOpenAIReasoningOptions } from '@/infrastructure/providers/reasoningControl';
import { getProviderDefaults } from '@/infrastructure/providers/config/providerConfig';
import { ProviderChat } from '@/infrastructure/providers/types';

export const OPENAI_PROVIDER_ID: ProviderId = 'openai';

class OpenAIProvider extends AISdkOpenAIResponsesProviderBase implements ProviderChat {
  private previousResponseId?: string;

  constructor() {
    const { defaultModel, defaultApiKey } = getProviderDefaults(OPENAI_PROVIDER_ID);
    super({
      id: OPENAI_PROVIDER_ID,
      defaultModel,
      defaultApiKey,
      defaultBaseUrl: getDefaultOpenAIBaseUrl(),
      missingApiKeyError: t('settings.provider.error.openai.missingApiKey'),
      logLabel: 'OpenAI',
      supportsBaseUrl: true,
      providerName: 'openai',
    });
  }

  protected override resolveBaseUrl(baseUrl?: string): string | undefined {
    const trimmed = baseUrl?.trim();
    return trimmed ? resolveBaseUrl(trimmed) : getDefaultOpenAIBaseUrl();
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
    requestPolicy?: import('@/infrastructure/providers/requestPolicy').RequestPolicy;
    previousResponseId?: string;
  }): Record<string, unknown> | undefined {
    const options: Record<string, unknown> = {
      ...(super.buildResponsesProviderOptions({
        providerName: 'openai',
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

  protected override createHostedSearchTool(
    provider: ReturnType<typeof import('@ai-sdk/openai').createOpenAI>
  ): unknown {
    if (!getSupportsHostedToolSearch(this.modelName)) {
      return undefined;
    }

    return provider.tools.webSearch({
      externalWebAccess: true,
      searchContextSize: 'medium',
    });
  }

  protected override createHostedToolSearchTool(
    provider: ReturnType<typeof import('@ai-sdk/openai').createOpenAI>
  ): unknown {
    if (!getSupportsHostedToolSearch(this.modelName)) {
      return undefined;
    }

    return provider.tools.toolSearch();
  }
}

export const createProviderInstance = (): ProviderChat => new OpenAIProvider();
