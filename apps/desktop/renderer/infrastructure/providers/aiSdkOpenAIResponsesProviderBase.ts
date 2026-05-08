import { type ChatMessage, type ChatPromptInput } from '@/shared/types/chat';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type { ProviderChat } from '@/infrastructure/providers/types';
import { toModelMessages } from '@/infrastructure/providers/aiSdkProviderMessages';
import {
  AISdkProviderStateBase,
  type SharedProviderBaseOptions,
} from '@/infrastructure/providers/aiSdkProviderState';
import { buildProviderOptionsRecord } from '@/infrastructure/providers/aiSdkProviderTools';
import {
  createProviderTextExecution,
  resolveProviderTextExecutionTools,
  streamProviderTextExecution,
  type ResponsesPrompt,
} from '@/infrastructure/providers/aiSdkProviderExecution';

type ChatProviderContext = {
  providerName: string;
  modelName: string;
  emitReasoning: boolean;
  requestPolicy?: RequestPolicy;
};

type ResponsesProviderContext = ChatProviderContext & {
  previousResponseId?: string;
};

type OpenAIResponsesProviderBaseOptions = SharedProviderBaseOptions;

export abstract class AISdkOpenAIResponsesProviderBase
  extends AISdkProviderStateBase
  implements ProviderChat
{
  constructor(options: OpenAIResponsesProviderBaseOptions) {
    super(options);
  }

  protected createHostedSearchTool(_provider: ReturnType<typeof createOpenAI>): unknown {
    return undefined;
  }

  protected createHostedToolSearchTool(_provider: ReturnType<typeof createOpenAI>): unknown {
    return undefined;
  }

  protected async buildAdditionalResponseTools(_context: {
    provider: ReturnType<typeof createOpenAI>;
    modelName: string;
    searchEnabled: boolean;
    requestPolicy?: RequestPolicy;
  }): Promise<Record<string, unknown> | undefined> {
    return undefined;
  }

  protected async handleResponseResult(_payload: {
    result: ReturnType<typeof import('ai').streamText>;
    modelName: string;
  }): Promise<void> {
    await this.patchGeneratedImagesFromResult(_payload.result);
  }

  protected getPreviousResponseId(): string | undefined {
    return undefined;
  }

  protected setPreviousResponseId(_responseId?: string): void {}

  protected shouldUsePreviousResponseId(): boolean {
    return false;
  }

  protected buildResponsesProviderOptions({
    requestPolicy,
  }: ResponsesProviderContext): Record<string, unknown> | undefined {
    if ((requestPolicy?.toolParallelism ?? 1) <= 1) {
      return undefined;
    }

    return {
      parallelToolCalls: true,
    };
  }

  protected buildResponsePrompt(nextHistory: ChatMessage[], promptText: string): ResponsesPrompt {
    const previousResponseId = this.getPreviousResponseId();
    if (this.shouldUsePreviousResponseId() && previousResponseId) {
      return {
        messages: [{ role: 'user', content: promptText }],
      };
    }

    return {
      messages: toModelMessages(nextHistory),
    };
  }

  protected resolveModelNameForResponse({ modelName }: ResponsesProviderContext): string {
    return modelName;
  }

  protected invalidateConversationState(): void {
    if (this.shouldUsePreviousResponseId()) {
      this.setPreviousResponseId(undefined);
    }
  }

  protected override onProviderStateChanged(kind: string): void {
    if (
      kind === 'modelName' ||
      kind === 'imageModelName' ||
      kind === 'systemPrompt' ||
      kind === 'apiKey' ||
      kind === 'baseUrl' ||
      kind === 'customHeaders' ||
      kind === 'tavilyConfig'
    ) {
      this.invalidateConversationState();
    }
  }

  protected getProviderName(): string {
    return this.providerName;
  }

  override resetChat(): void {
    super.resetChat();
    this.invalidateConversationState();
  }

  override async startChatWithHistory(messages: ChatMessage[]): Promise<void> {
    await super.startChatWithHistory(messages);
    this.invalidateConversationState();
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

    const providerName = this.getProviderName();
    const execution = createProviderTextExecution({
      state: this.createTextExecutionState(providerName, this.reasoningPreference.enabled),
      message,
    });
    const { promptText, emitReasoning, nextHistory, runtime } = execution;
    const previousResponseId = this.shouldUsePreviousResponseId()
      ? this.getPreviousResponseId()
      : undefined;
    const requestModelName = this.resolveModelNameForResponse({
      providerName,
      modelName: this.modelName,
      emitReasoning,
      requestPolicy,
      previousResponseId,
    });
    const gatewayConfig = this.resolveAiGatewayCallRequestConfig();

    if (gatewayConfig) {
      this.invalidateConversationState();
      const provider = createOpenAICompatible({
        name: runtime.providerName,
        apiKey: this.resolveApiKey(),
        baseURL: gatewayConfig.baseUrl,
        headers: {
          ...runtime.customHeaders,
          ...this.buildExtraHeaders(),
        },
        fetch: this.buildRuntimeFetch(),
      });
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
        onResult: ({ result }) =>
          this.handleResponseResult({
            result,
            modelName: requestModelName,
          }),
        streamOptions: {
          model: provider(requestModelName),
          system: this.systemPrompt,
          messages: toModelMessages(nextHistory),
          tools: tools as any,
        },
      });

      this.recordResponseCompletionMetadata(completion.responseId);
      return;
    }

    const provider = createOpenAI({
      name: runtime.providerName,
      apiKey: this.resolveApiKey(),
      baseURL: this.resolveTransportBaseUrl(this.baseUrl),
      headers: {
        ...runtime.customHeaders,
        ...this.buildExtraHeaders(),
      },
      fetch: this.buildRuntimeFetch(),
    });

    const prompt = this.buildResponsePrompt(nextHistory, promptText);
    const tools = await resolveProviderTextExecutionTools({
      requestPolicy,
      runtime,
      hostedSearchTool: runtime.hostedSearchEnabled
        ? this.createHostedSearchTool(provider)
        : undefined,
      hostedToolSearchTool: runtime.toolSearchEnabled
        ? this.createHostedToolSearchTool(provider)
        : undefined,
      additionalTools: await this.buildAdditionalResponseTools({
        provider,
        modelName: requestModelName,
        searchEnabled: runtime.searchEnabled,
        requestPolicy,
      }),
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
      onCompleted: (streamed) => {
        if (this.shouldUsePreviousResponseId()) {
          this.setPreviousResponseId(streamed.lastResponseId ?? previousResponseId);
        }
      },
      onResult: ({ result }) =>
        this.handleResponseResult({
          result,
          modelName: requestModelName,
        }),
      streamOptions: {
        model: provider(requestModelName),
        system: this.systemPrompt,
        messages: prompt.messages,
        tools: tools as any,
        providerOptions: buildProviderOptionsRecord(
          ['openai', runtime.providerName],
          this.buildResponsesProviderOptions({
            providerName: runtime.providerName,
            modelName: requestModelName,
            emitReasoning,
            requestPolicy,
            previousResponseId,
          })
        ) as any,
      },
    });

    this.recordResponseCompletionMetadata(completion.responseId);
  }
}
