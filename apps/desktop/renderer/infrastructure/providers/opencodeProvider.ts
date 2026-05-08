import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { ChatPromptInput, ProviderId } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import { toModelMessages } from '@/infrastructure/providers/aiSdkProviderMessages';
import { buildProviderOptionsRecord } from '@/infrastructure/providers/aiSdkProviderBase';
import {
  AISdkProviderStateBase,
  toDefinedOptions,
} from '@/infrastructure/providers/aiSdkProviderState';
import { getDefaultOpenCodeBaseUrl } from '@/infrastructure/providers/config/baseUrl';
import { getProviderDefaults } from '@/infrastructure/providers/config/providerConfig';
import { fetchOpenAIStyleModels } from '@/infrastructure/providers/modelDiscovery';
import { AI_GATEWAY_DUMMY_API_KEY } from '@/infrastructure/providers/aiGatewaySettings';
import {
  buildOpenAICompatibleChatReasoningOptions,
  buildOpenAIReasoningOptions,
} from '@/infrastructure/providers/reasoningControl';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type { ProviderChat, ProviderModelItem } from '@/infrastructure/providers/types';
import {
  createProviderTextExecution,
  resolveProviderTextExecutionTools,
  streamProviderTextExecution,
} from '@/infrastructure/providers/aiSdkProviderExecution';
import {
  buildOpenCodeModelGroup,
  normalizeOpenCodeBaseUrl,
  resolveOpenCodeModelTransport,
} from '@/infrastructure/providers/opencodeTransport';

export const OPENCODE_PROVIDER_ID: ProviderId = 'opencode';

type OpenCodeStreamOptions = {
  signal?: AbortSignal;
  emitReasoning: boolean;
  runtime: ReturnType<typeof createProviderTextExecution>['runtime'];
  nextHistory: ReturnType<typeof createProviderTextExecution>['nextHistory'];
  requestPolicy?: RequestPolicy;
  model: unknown;
  messages?: unknown;
  providerOptions?: Record<string, unknown>;
  onCompleted?: Parameters<typeof streamProviderTextExecution>[0]['onCompleted'];
};

class OpenCodeProvider extends AISdkProviderStateBase implements ProviderChat {
  private previousResponseId?: string;

  constructor() {
    const { defaultModel, defaultApiKey, defaultBaseUrl } =
      getProviderDefaults(OPENCODE_PROVIDER_ID);

    super({
      id: OPENCODE_PROVIDER_ID,
      defaultModel,
      defaultApiKey,
      defaultBaseUrl: defaultBaseUrl ?? getDefaultOpenCodeBaseUrl(),
      missingApiKeyError: t('settings.provider.error.opencode.missingApiKey'),
      logLabel: 'OpenCode',
      supportsBaseUrl: true,
      supportsCustomHeaders: true,
      providerName: OPENCODE_PROVIDER_ID,
    });
  }

  protected override resolveBaseUrl(baseUrl?: string): string {
    return normalizeOpenCodeBaseUrl(baseUrl?.trim() || getDefaultOpenCodeBaseUrl());
  }

  protected override onProviderStateChanged(kind: string): void {
    if (
      kind === 'modelName' ||
      kind === 'systemPrompt' ||
      kind === 'apiKey' ||
      kind === 'baseUrl' ||
      kind === 'customHeaders' ||
      kind === 'tavilyConfig'
    ) {
      this.previousResponseId = undefined;
    }
  }

  override resetChat(): void {
    super.resetChat();
    this.previousResponseId = undefined;
  }

  override async startChatWithHistory(
    messages: Parameters<ProviderChat['startChatWithHistory']>[0]
  ) {
    await super.startChatWithHistory(messages);
    this.previousResponseId = undefined;
  }

  private buildResponsesProviderOptions({
    emitReasoning,
    requestPolicy,
    previousResponseId,
  }: {
    emitReasoning: boolean;
    requestPolicy?: RequestPolicy;
    previousResponseId?: string;
  }): Record<string, unknown> | undefined {
    const options: Record<string, unknown> = {
      ...(buildOpenAIReasoningOptions(this.modelName, {
        enabled: emitReasoning,
        level: this.reasoningPreference.level,
      }) ?? {}),
    };

    if (previousResponseId) {
      options.previousResponseId = previousResponseId;
    }

    if ((requestPolicy?.toolParallelism ?? 1) > 1) {
      options.parallelToolCalls = true;
    }

    return toDefinedOptions(options);
  }

  private buildChatProviderOptions({
    emitReasoning,
    requestPolicy,
  }: {
    emitReasoning: boolean;
    requestPolicy?: RequestPolicy;
  }): Record<string, unknown> | undefined {
    const options: Record<string, unknown> = {
      ...(buildOpenAICompatibleChatReasoningOptions(this.modelName, {
        enabled: emitReasoning,
        level: this.reasoningPreference.level,
      }) ?? {}),
    };

    if ((requestPolicy?.toolParallelism ?? 1) > 1) {
      options.parallelToolCalls = true;
    }

    return toDefinedOptions(options);
  }

  override async listModels(): Promise<ProviderModelItem[]> {
    const baseUrl = this.resolveTransportBaseUrl(this.baseUrl);
    if (!baseUrl) {
      return [];
    }

    const models = await fetchOpenAIStyleModels({
      baseUrl,
      apiKey: this.resolveApiKey(),
      customHeaders: this.getCustomHeaders(),
      fetcher: this.buildRuntimeFetch(),
    });

    return models.map((model) => ({
      ...model,
      group: buildOpenCodeModelGroup(model.id, baseUrl),
    }));
  }

  private async *streamTextCompletion({
    signal,
    emitReasoning,
    runtime,
    nextHistory,
    requestPolicy,
    model,
    messages,
    providerOptions,
    onCompleted,
  }: OpenCodeStreamOptions): AsyncGenerator<string, void, unknown> {
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
      onCompleted,
      onResult: async ({ result }) => {
        await this.patchGeneratedImagesFromResult(result);
      },
      streamOptions: {
        model: model as any,
        system: this.systemPrompt,
        messages: (messages ?? toModelMessages(nextHistory)) as any,
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
    const { promptText, emitReasoning, nextHistory, runtime } = execution;
    const apiKey = this.resolveApiKey();
    const gatewayConfig = this.resolveAiGatewayCallRequestConfig();
    const baseURL = gatewayConfig?.baseUrl ?? this.resolveTransportBaseUrl(this.baseUrl);
    const transport = resolveOpenCodeModelTransport(this.modelName, baseURL);

    if (gatewayConfig) {
      this.previousResponseId = undefined;

      if (transport === 'messages') {
        const provider = createAnthropic({
          name: runtime.providerName,
          authToken: gatewayConfig.apiKey ?? AI_GATEWAY_DUMMY_API_KEY,
          baseURL: gatewayConfig.anthropicBaseUrl,
          headers: {
            ...runtime.customHeaders,
            ...this.buildExtraHeaders(),
          },
          fetch: this.buildRuntimeFetch(),
        });
        yield* this.streamTextCompletion({
          signal,
          emitReasoning,
          runtime,
          nextHistory,
          requestPolicy,
          model: provider.messages(this.modelName),
        });
        return;
      }

      if (transport === 'google') {
        const provider = createGoogleGenerativeAI({
          name: runtime.providerName,
          apiKey: gatewayConfig.apiKey ?? AI_GATEWAY_DUMMY_API_KEY,
          baseURL: gatewayConfig.geminiBaseUrl,
          headers: {
            ...(gatewayConfig.apiKey
              ? {
                  Authorization: `Bearer ${gatewayConfig.apiKey}`,
                }
              : {}),
            ...runtime.customHeaders,
            ...this.buildExtraHeaders(),
          },
          fetch: this.buildRuntimeFetch(),
        });
        yield* this.streamTextCompletion({
          signal,
          emitReasoning,
          runtime,
          nextHistory,
          requestPolicy,
          model: provider(this.modelName),
        });
        return;
      }

      const provider = createOpenAICompatible({
        name: runtime.providerName,
        apiKey,
        baseURL: gatewayConfig.baseUrl,
        headers: {
          ...runtime.customHeaders,
          ...this.buildExtraHeaders(),
        },
        fetch: this.buildRuntimeFetch(),
      });
      yield* this.streamTextCompletion({
        signal,
        emitReasoning,
        runtime,
        nextHistory,
        requestPolicy,
        model: provider(this.modelName),
        providerOptions: buildProviderOptionsRecord(
          ['openaiCompatible', runtime.providerName],
          this.buildChatProviderOptions({
            emitReasoning,
            requestPolicy,
          })
        ),
      });
      return;
    }

    if (transport === 'responses') {
      const previousResponseId = this.previousResponseId;
      const provider = createOpenAI({
        name: runtime.providerName,
        apiKey,
        baseURL,
        headers: {
          ...runtime.customHeaders,
          ...this.buildExtraHeaders(),
        },
        fetch: this.buildRuntimeFetch(),
      });
      yield* this.streamTextCompletion({
        signal,
        emitReasoning,
        runtime,
        nextHistory,
        requestPolicy,
        model: provider.responses(this.modelName),
        messages: previousResponseId
          ? [{ role: 'user' as const, content: promptText }]
          : toModelMessages(nextHistory),
        onCompleted: (streamed) => {
          this.previousResponseId = streamed.lastResponseId ?? previousResponseId;
        },
        providerOptions: buildProviderOptionsRecord(
          ['openai', runtime.providerName],
          this.buildResponsesProviderOptions({
            emitReasoning,
            requestPolicy,
            previousResponseId,
          })
        ),
      });
      return;
    }

    this.previousResponseId = undefined;

    if (transport === 'messages') {
      const provider = createAnthropic({
        name: runtime.providerName,
        apiKey,
        baseURL,
        headers: {
          ...runtime.customHeaders,
          ...this.buildExtraHeaders(),
        },
        fetch: this.buildRuntimeFetch(),
      });
      yield* this.streamTextCompletion({
        signal,
        emitReasoning,
        runtime,
        nextHistory,
        requestPolicy,
        model: provider.messages(this.modelName),
      });
      return;
    }

    if (transport === 'google') {
      const provider = createGoogleGenerativeAI({
        name: runtime.providerName,
        apiKey,
        baseURL,
        headers: {
          ...runtime.customHeaders,
          ...this.buildExtraHeaders(),
        },
        fetch: this.buildRuntimeFetch(),
      });
      yield* this.streamTextCompletion({
        signal,
        emitReasoning,
        runtime,
        nextHistory,
        requestPolicy,
        model: provider(this.modelName),
      });
      return;
    }

    const provider = createOpenAICompatible({
      name: runtime.providerName,
      apiKey,
      baseURL: baseURL ?? '',
      headers: {
        ...runtime.customHeaders,
        ...this.buildExtraHeaders(),
      },
      fetch: this.buildRuntimeFetch(),
    });
    yield* this.streamTextCompletion({
      signal,
      emitReasoning,
      runtime,
      nextHistory,
      requestPolicy,
      model: provider(this.modelName),
      providerOptions: buildProviderOptionsRecord(
        ['openaiCompatible', runtime.providerName],
        this.buildChatProviderOptions({
          emitReasoning,
          requestPolicy,
        })
      ),
    });
  }
}

export const createProviderInstance = (): ProviderChat => new OpenCodeProvider();
