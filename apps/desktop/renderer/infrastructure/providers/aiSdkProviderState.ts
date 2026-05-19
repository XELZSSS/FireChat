import { ChatPromptInput, ProviderId } from '@/shared/types/chat';
import { fetchOpenAIStyleModels } from '@/infrastructure/providers/modelDiscovery';
import { OpenAIStyleProviderBase } from '@/infrastructure/providers/openaiBase';
import { normalizeCustomHeaders } from '@/infrastructure/providers/headerUtils';
import type {
  ProviderModelItem,
  ProviderReasoningPreference,
  ProviderResponseMetadata,
} from '@/infrastructure/providers/types';
import { sanitizeApiKey } from '@/infrastructure/providers/utils';
import type { HeaderPair } from '@/infrastructure/providers/aiSdkProviderMessages';
import { areComparableValuesEqual } from '@/shared/utils/comparable';
import { providerHttpFetch } from '@/infrastructure/network/proxyFetch';
import {
  createSharedProviderBaseState,
  DEFAULT_REASONING_PREFERENCE,
  type ProviderFetch,
  type ProviderStateChangeKind,
  type SharedProviderBaseOptions,
} from '@/infrastructure/providers/aiSdkProviderStateFactory';

export {
  createProviderRuntimeState,
  toDefinedOptions,
} from '@/infrastructure/providers/aiSdkProviderStateFactory';
export type {
  ProviderFetch,
  ProviderRuntimeState,
  SharedProviderBaseOptions,
  SharedProviderBaseState,
} from '@/infrastructure/providers/aiSdkProviderStateFactory';

export abstract class AISdkProviderStateBase extends OpenAIStyleProviderBase {
  protected readonly id: ProviderId;
  protected readonly logLabel: string;
  protected apiKey?: string;
  protected modelName: string;
  protected reasoningPreference: ProviderReasoningPreference = DEFAULT_REASONING_PREFERENCE;
  protected baseUrl?: string;
  protected customHeaders: HeaderPair[] = [];

  protected readonly defaultApiKey?: string;
  protected readonly missingApiKeyError?: string;
  protected readonly supportsBaseUrl: boolean;
  protected readonly supportsCustomHeaders: boolean;
  protected readonly providerName: string;

  constructor(options: SharedProviderBaseOptions) {
    super();
    const shared = createSharedProviderBaseState(options);
    this.id = shared.id;
    this.logLabel = shared.logLabel;
    this.apiKey = shared.apiKey;
    this.modelName = shared.modelName;
    this.baseUrl = shared.baseUrl;
    this.defaultApiKey = shared.defaultApiKey;
    this.missingApiKeyError = shared.missingApiKeyError;
    this.supportsBaseUrl = shared.supportsBaseUrl;
    this.supportsCustomHeaders = shared.supportsCustomHeaders;
    this.providerName = shared.providerName;
  }

  protected onProviderStateChanged(_kind: ProviderStateChangeKind): void {}

  protected resolveApiKey(): string | undefined {
    const keyToUse = this.apiKey ?? this.defaultApiKey;
    if (!keyToUse && this.missingApiKeyError) {
      throw new Error(this.missingApiKeyError);
    }
    return keyToUse;
  }

  protected resolveBaseUrl(baseUrl?: string): string | undefined {
    return baseUrl;
  }

  protected resolveTransportBaseUrl(baseUrl?: string): string | undefined {
    return this.resolveBaseUrl(baseUrl);
  }

  protected resolveListModelsBaseUrl(): string | undefined {
    return this.resolveTransportBaseUrl(this.baseUrl);
  }

  protected buildExtraHeaders(): Record<string, string> {
    return {};
  }

  protected buildFetch(): ProviderFetch | undefined {
    return providerHttpFetch;
  }

  protected buildRuntimeFetch(): ProviderFetch {
    const baseFetch = this.buildFetch() ?? fetch;

    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await baseFetch(input, init);
      this.recordResponseTransportMetadata({
        statusCode: response.status,
        upstreamRequestId:
          response.headers.get('x-request-id') ??
          response.headers.get('request-id') ??
          response.headers.get('x-requestid') ??
          undefined,
      });
      return response;
    };
  }

  protected createTextExecutionState(providerName: string, reasoningEnabled: boolean) {
    return {
      id: this.id,
      modelName: this.modelName,
      providerName,
      supportsCustomHeaders: this.supportsCustomHeaders,
      customHeaders: this.customHeaders,
      shouldEmitReasoning: this.shouldEmitReasoning.bind(this),
      reasoningEnabled,
      createNextHistory: this.createNextHistory.bind(this),
    };
  }

  protected recordResponseTransportMetadata(
    metadata: Pick<ProviderResponseMetadata, 'statusCode' | 'upstreamRequestId'>
  ): void {
    this.patchPendingResponseMetadata(metadata);
  }

  protected recordResponseCompletionMetadata(responseId?: string): void {
    const normalizedResponseId = typeof responseId === 'string' ? responseId.trim() : '';
    if (!normalizedResponseId) {
      return;
    }

    this.patchPendingResponseMetadata({
      responseId: normalizedResponseId,
    });
  }

  protected getMaxRetries(): number {
    return 0;
  }

  getId(): ProviderId {
    return this.id;
  }

  getModelName(): string {
    return this.modelName;
  }

  setModelName(model: string): void {
    this.setTrimmedModelName(this.modelName, model, (nextModel) => {
      this.modelName = nextModel;
      this.onProviderStateChanged('modelName');
    });
  }

  override setSystemPrompt(systemPrompt?: string): void {
    const nextSystemPrompt = systemPrompt?.trim() ?? '';
    if (nextSystemPrompt === this.systemPrompt) {
      return;
    }

    this.systemPrompt = nextSystemPrompt;
    this.onProviderStateChanged('systemPrompt');
  }

  getApiKey(): string | undefined {
    return this.apiKey;
  }

  setApiKey(apiKey?: string): void {
    const nextApiKey = sanitizeApiKey(apiKey) ?? this.defaultApiKey;
    if (nextApiKey === this.apiKey) {
      return;
    }

    this.apiKey = nextApiKey;
    this.onProviderStateChanged('apiKey');
  }

  getBaseUrl(): string | undefined {
    return this.baseUrl;
  }

  setBaseUrl(baseUrl?: string): void {
    if (!this.supportsBaseUrl) {
      return;
    }

    const nextBaseUrl = this.resolveBaseUrl(baseUrl);
    if (nextBaseUrl === this.baseUrl) {
      return;
    }

    this.baseUrl = nextBaseUrl;
    this.onProviderStateChanged('baseUrl');
  }

  getCustomHeaders(): HeaderPair[] | undefined {
    return this.customHeaders;
  }

  setCustomHeaders(headers: HeaderPair[]): void {
    if (!this.supportsCustomHeaders) {
      this.customHeaders = [];
      return;
    }

    const nextHeaders = normalizeCustomHeaders(headers);
    if (areComparableValuesEqual(nextHeaders, this.customHeaders)) {
      return;
    }

    this.customHeaders = nextHeaders;
    this.onProviderStateChanged('customHeaders');
  }

  getReasoningPreference(): ProviderReasoningPreference {
    return this.reasoningPreference;
  }

  setReasoningPreference(preference: ProviderReasoningPreference): void {
    const nextPreference: ProviderReasoningPreference = {
      enabled: preference.enabled,
      level: preference.level ?? DEFAULT_REASONING_PREFERENCE.level,
    };

    if (
      this.reasoningPreference.enabled === nextPreference.enabled &&
      this.reasoningPreference.level === nextPreference.level
    ) {
      return;
    }

    this.reasoningPreference = nextPreference;
    this.onProviderStateChanged('reasoningPreference');
  }

  async listModels(): Promise<ProviderModelItem[]> {
    const apiKey = this.resolveApiKey();
    const baseUrl = this.resolveListModelsBaseUrl();
    if (!baseUrl) {
      return [];
    }

    return fetchOpenAIStyleModels({
      baseUrl,
      apiKey,
      customHeaders: this.getCustomHeaders(),
      fetcher: this.buildRuntimeFetch(),
    });
  }
}
