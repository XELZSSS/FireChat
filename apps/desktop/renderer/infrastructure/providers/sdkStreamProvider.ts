import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { type ChatPromptInput } from '@/shared/types/chat';
import {
  buildProviderOptionsRecord,
  toModelMessages,
} from '@/infrastructure/providers/aiSdkProviderBase';
import type { AiGatewayCallRequestConfig } from '@/infrastructure/providers/aiGatewaySettings';
import {
  AISdkProviderStateBase,
  type SharedProviderBaseOptions,
} from '@/infrastructure/providers/aiSdkProviderState';
import { fetchOpenAIStyleModels } from '@/infrastructure/providers/modelDiscovery';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type {
  ProviderModelItem,
  ProviderReasoningPreference,
} from '@/infrastructure/providers/types';
import {
  createProviderTextExecution,
  resolveProviderTextExecutionTools,
  streamProviderTextExecution,
} from '@/infrastructure/providers/aiSdkProviderExecution';

type ProviderFactoryContext = {
  apiKey: string;
  baseUrl?: string;
  fetch: typeof fetch;
  customHeaders?: Array<{ key: string; value: string }>;
};

type GatewayProviderFactoryContext = {
  apiKey?: string;
  baseUrl: string;
  gatewayConfig: AiGatewayCallRequestConfig;
  fetch: typeof fetch;
  customHeaders?: Array<{ key: string; value: string }>;
};

type RequestModelContext<TProvider> = {
  provider: TProvider;
  modelName: string;
  requestModelName: string;
  emitReasoning: boolean;
};

type ProviderOptionsContext = {
  modelName: string;
  requestModelName: string;
  emitReasoning: boolean;
  reasoningPreference: ProviderReasoningPreference;
  requestPolicy?: RequestPolicy;
};

type BaseUrlNormalizer = (baseUrl: string) => string | undefined;
type TransportBaseUrlResolver = (baseUrl?: string) => string | undefined;

export type AISdkStreamProviderOptions<TProvider> = SharedProviderBaseOptions & {
  getDefaultBaseUrl?: () => string | undefined;
  normalizeBaseUrl?: BaseUrlNormalizer;
  resolveTransportBaseUrl?: TransportBaseUrlResolver;
  createSdkProvider: (context: ProviderFactoryContext) => TProvider;
  createGatewaySdkProvider?: (context: GatewayProviderFactoryContext) => TProvider;
  createModel: (context: RequestModelContext<TProvider>) => unknown;
  buildProviderOptions?: (context: ProviderOptionsContext) => Record<string, unknown> | undefined;
  listModels?: (context: {
    apiKey: string;
    baseUrl: string;
    fetch: typeof fetch;
    customHeaders?: Array<{ key: string; value: string }>;
  }) => Promise<ProviderModelItem[]>;
  listGatewayModels?: (context: {
    apiKey?: string;
    baseUrl: string;
    gatewayConfig: AiGatewayCallRequestConfig;
    fetch: typeof fetch;
    customHeaders?: Array<{ key: string; value: string }>;
  }) => Promise<ProviderModelItem[]>;
  resolveRequestModelName?: (context: { modelName: string; emitReasoning: boolean }) => string;
};

export class AISdkStreamProvider<TProvider> extends AISdkProviderStateBase {
  constructor(private readonly options: AISdkStreamProviderOptions<TProvider>) {
    super({
      ...options,
      defaultBaseUrl: options.getDefaultBaseUrl?.(),
      supportsTavily: options.supportsTavily ?? true,
      supportsBaseUrl: options.supportsBaseUrl ?? true,
      supportsCustomHeaders: options.supportsCustomHeaders ?? false,
    });
  }

  protected override resolveBaseUrl(baseUrl?: string): string | undefined {
    const trimmed = baseUrl?.trim();
    if (trimmed) {
      return this.options.normalizeBaseUrl ? this.options.normalizeBaseUrl(trimmed) : trimmed;
    }

    return this.options.getDefaultBaseUrl?.();
  }

  protected override resolveTransportBaseUrl(baseUrl?: string): string | undefined {
    return (
      this.resolveAiGatewayBaseUrl() ?? this.options.resolveTransportBaseUrl?.(baseUrl) ?? baseUrl
    );
  }

  override async listModels(): Promise<ProviderModelItem[]> {
    const gatewayConfig = this.resolveAiGatewayCallRequestConfig();
    if (gatewayConfig) {
      if (this.options.listGatewayModels) {
        return this.options.listGatewayModels({
          apiKey: gatewayConfig.apiKey,
          baseUrl: gatewayConfig.baseUrl,
          gatewayConfig,
          fetch: this.buildRuntimeFetch(),
          customHeaders: this.getCustomHeaders(),
        });
      }

      return fetchOpenAIStyleModels({
        apiKey: gatewayConfig.apiKey,
        baseUrl: gatewayConfig.baseUrl,
        customHeaders: this.getCustomHeaders(),
        fetcher: this.buildRuntimeFetch(),
      });
    }

    const apiKey = this.resolveApiKey();
    if (!apiKey) {
      throw new Error(this.missingApiKeyError ?? 'Missing API key');
    }

    if (!this.options.listModels) {
      return [];
    }

    const baseUrl = this.resolveTransportBaseUrl(this.baseUrl);
    if (!baseUrl) {
      return [];
    }

    return this.options.listModels({
      apiKey,
      baseUrl,
      fetch: this.buildRuntimeFetch(),
      customHeaders: this.getCustomHeaders(),
    });
  }

  private async *streamTextCompletion({
    signal,
    emitReasoning,
    runtime,
    nextHistory,
    requestPolicy,
    model,
    providerOptions,
  }: {
    signal?: AbortSignal;
    emitReasoning: boolean;
    runtime: ReturnType<typeof createProviderTextExecution>['runtime'];
    nextHistory: ReturnType<typeof createProviderTextExecution>['nextHistory'];
    requestPolicy?: RequestPolicy;
    model: unknown;
    providerOptions?: Record<string, unknown>;
  }): AsyncGenerator<string, void, unknown> {
    const tools = await resolveProviderTextExecutionTools({
      requestPolicy,
      runtime,
      nextHistory,
    });

    const completion = yield* streamProviderTextExecution({
      logLabel: this.logLabel,
      maxRetries: this.getMaxRetries(),
      signal,
      emitReasoning,
      providerId: runtime.id,
      nextHistory,
      requestPolicy,
      commitHistory: this.setHistoryWithModelResponse.bind(this),
      onResult: async ({ result }) => {
        await this.patchGeneratedImagesFromResult(result);
      },
      streamOptions: {
        model: model as any,
        system: this.systemPrompt,
        messages: toModelMessages(nextHistory),
        tools: tools as any,
        providerOptions: providerOptions as any,
      },
    });

    this.recordResponseCompletionMetadata(completion.responseId);
  }

  async *sendMessageStream(
    message: ChatPromptInput,
    signal?: AbortSignal,
    requestPolicy?: RequestPolicy
  ): AsyncGenerator<string, void, unknown> {
    if (message.imageGenerationEnabled) {
      await this.generateImageResponse(message);
      return;
    }

    const execution = createProviderTextExecution({
      state: this.createTextExecutionState(this.providerName, this.reasoningPreference.enabled),
      message,
    });
    const { emitReasoning, nextHistory, runtime } = execution;
    const requestModelName =
      this.options.resolveRequestModelName?.({
        modelName: this.modelName,
        emitReasoning,
      }) ?? this.modelName;
    const gatewayConfig = this.resolveAiGatewayCallRequestConfig();
    if (gatewayConfig) {
      if (this.options.createGatewaySdkProvider) {
        const provider = this.options.createGatewaySdkProvider({
          apiKey: gatewayConfig.apiKey,
          baseUrl: gatewayConfig.baseUrl,
          gatewayConfig,
          fetch: this.buildRuntimeFetch(),
          customHeaders: this.getCustomHeaders(),
        });
        yield* this.streamTextCompletion({
          signal,
          emitReasoning,
          requestPolicy,
          runtime,
          nextHistory,
          model: this.options.createModel({
            provider,
            modelName: this.modelName,
            requestModelName,
            emitReasoning,
          }),
        });

        return;
      }

      const provider = createOpenAICompatible({
        name: runtime.providerName,
        apiKey: gatewayConfig.apiKey,
        baseURL: gatewayConfig.baseUrl,
        headers: runtime.customHeaders,
        fetch: this.buildRuntimeFetch(),
      });
      yield* this.streamTextCompletion({
        signal,
        emitReasoning,
        requestPolicy,
        runtime,
        nextHistory,
        model: provider(requestModelName),
        providerOptions: buildProviderOptionsRecord(['openaiCompatible', runtime.providerName]),
      });

      return;
    }

    const apiKey = this.resolveApiKey();
    if (!apiKey) {
      throw new Error(this.missingApiKeyError ?? 'Missing API key');
    }

    const provider = this.options.createSdkProvider({
      apiKey,
      baseUrl: this.resolveTransportBaseUrl(this.baseUrl),
      fetch: this.buildRuntimeFetch(),
      customHeaders: this.getCustomHeaders(),
    });

    yield* this.streamTextCompletion({
      signal,
      emitReasoning,
      runtime,
      nextHistory,
      requestPolicy,
      model: this.options.createModel({
        provider,
        modelName: this.modelName,
        requestModelName,
        emitReasoning,
      }),
      providerOptions: this.options.buildProviderOptions?.({
        modelName: this.modelName,
        requestModelName,
        emitReasoning,
        reasoningPreference: this.reasoningPreference,
        requestPolicy,
      }),
    });
  }
}
