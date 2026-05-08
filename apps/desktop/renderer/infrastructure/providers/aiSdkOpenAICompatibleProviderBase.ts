import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { type ChatPromptInput } from '@/shared/types/chat';
import {
  buildOpenAICompatibleChatReasoningOptions,
  resolveOpenAICompatibleModelForReasoning,
} from '@/infrastructure/providers/reasoningControl';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type { ProviderChat } from '@/infrastructure/providers/types';
import { toModelMessages } from '@/infrastructure/providers/aiSdkProviderMessages';
import {
  AISdkProviderStateBase,
  type SharedProviderBaseOptions,
  toDefinedOptions,
} from '@/infrastructure/providers/aiSdkProviderState';
import {
  buildProviderOptionsRecord,
  buildToolSet,
} from '@/infrastructure/providers/aiSdkProviderTools';
import {
  createProviderTextExecution,
  resolveProviderTextExecutionTools,
  streamProviderTextExecution,
} from '@/infrastructure/providers/aiSdkProviderExecution';

type RequestBodyTransformContext = {
  emitReasoning: boolean;
};

type ChatProviderContext = {
  providerName: string;
  modelName: string;
  emitReasoning: boolean;
  requestPolicy?: RequestPolicy;
};

type OpenAICompatibleProviderBaseOptions = SharedProviderBaseOptions & {
  missingBaseUrlError?: string;
};

export abstract class AISdkOpenAICompatibleProviderBase
  extends AISdkProviderStateBase
  implements ProviderChat
{
  private readonly missingBaseUrlError?: string;

  constructor(options: OpenAICompatibleProviderBaseOptions) {
    super(options);
    this.missingBaseUrlError = options.missingBaseUrlError;
  }

  protected override resolveBaseUrl(baseUrl?: string): string | undefined {
    return baseUrl;
  }

  protected override resolveTransportBaseUrl(baseUrl?: string): string | undefined {
    return this.resolveAiGatewayBaseUrl() ?? this.resolveBaseUrl(baseUrl);
  }

  protected async buildAdditionalTools(_context: {
    apiKey?: string;
    searchEnabled: boolean;
    requestPolicy?: RequestPolicy;
  }): Promise<Record<string, unknown> | undefined> {
    return undefined;
  }

  protected shouldInlineCustomHeaders(_transportBaseUrl?: string): boolean {
    return true;
  }

  protected buildChatProviderOptions({
    emitReasoning,
    requestPolicy,
    modelName,
  }: ChatProviderContext): Record<string, unknown> | undefined {
    const options: Record<string, unknown> = {};
    const reasoningOptions = buildOpenAICompatibleChatReasoningOptions(modelName, {
      enabled: emitReasoning,
      level: this.reasoningPreference.level,
    });

    if (reasoningOptions) {
      Object.assign(options, reasoningOptions);
    }

    if ((requestPolicy?.toolParallelism ?? 1) > 1) {
      options.parallelToolCalls = true;
    }

    return toDefinedOptions(options);
  }

  protected transformRequestBody(
    requestBody: Record<string, unknown>,
    _context: RequestBodyTransformContext
  ): Record<string, unknown> {
    return requestBody;
  }

  protected resolveModelNameForRequest({ modelName, emitReasoning }: ChatProviderContext): string {
    return resolveOpenAICompatibleModelForReasoning(modelName, emitReasoning);
  }

  protected getRawReasoningTexts(_raw: unknown): string[] {
    return [];
  }

  protected createHostedSearchTool(_provider: ReturnType<typeof createOpenAICompatible>): unknown {
    return undefined;
  }

  protected createHostedToolSearchTool(
    _provider: ReturnType<typeof createOpenAICompatible>
  ): unknown {
    return undefined;
  }

  private requireBaseUrl(): string | undefined {
    const resolved = this.resolveTransportBaseUrl(this.getBaseUrl());
    if (!resolved && this.supportsBaseUrl && this.missingBaseUrlError) {
      throw new Error(this.missingBaseUrlError);
    }
    return resolved;
  }

  protected override resolveListModelsBaseUrl(): string | undefined {
    return this.requireBaseUrl();
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
    const requestModelName = this.resolveModelNameForRequest({
      providerName: this.providerName,
      modelName: this.modelName,
      emitReasoning,
      requestPolicy,
    });
    const apiKey = this.resolveApiKey();
    const transportBaseUrl = this.requireBaseUrl();
    const requestCustomHeaders = this.shouldInlineCustomHeaders(transportBaseUrl)
      ? runtime.customHeaders
      : {};
    const provider = createOpenAICompatible({
      name: runtime.providerName,
      baseURL: transportBaseUrl ?? '',
      apiKey,
      headers: {
        ...requestCustomHeaders,
        ...this.buildExtraHeaders(),
      },
      fetch: this.buildRuntimeFetch(),
      transformRequestBody: (requestBody) =>
        this.transformRequestBody(requestBody, {
          emitReasoning,
        }),
    });

    const additionalTools = await this.buildAdditionalTools({
      apiKey,
      searchEnabled: runtime.searchEnabled,
      requestPolicy,
    });
    const tools = await resolveProviderTextExecutionTools({
      requestPolicy,
      runtime,
      hostedSearchTool: runtime.hostedSearchEnabled
        ? this.createHostedSearchTool(provider)
        : undefined,
      hostedToolSearchTool: runtime.toolSearchEnabled
        ? this.createHostedToolSearchTool(provider)
        : undefined,
      additionalTools: {
        ...(additionalTools ?? {}),
      },
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
      rawReasoningExtractor: emitReasoning ? this.getRawReasoningTexts.bind(this) : undefined,
      onResult: async ({ result }) => {
        await this.patchGeneratedImagesFromResult(result);
      },
      streamOptions: {
        model: provider(requestModelName),
        system: this.systemPrompt,
        messages: toModelMessages(nextHistory),
        tools: tools as any,
        providerOptions: buildProviderOptionsRecord(
          ['openaiCompatible', runtime.providerName],
          this.buildChatProviderOptions({
            providerName: runtime.providerName,
            modelName: requestModelName,
            emitReasoning,
            requestPolicy,
          })
        ) as any,
        includeRawChunks: emitReasoning,
      },
    });

    this.recordResponseCompletionMetadata(completion.responseId);
  }
}

export { buildToolSet };
