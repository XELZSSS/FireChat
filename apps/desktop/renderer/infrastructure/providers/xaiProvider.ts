import { createXai, type XaiProvider } from '@ai-sdk/xai';
import { ChatMessage, ChatPromptInput, ProviderId } from '@/shared/types/chat';
import { getMessageAttachments, getMessageText } from '@/shared/utils/chatMessageParts';
import { buildProviderOptionsRecord } from '@/infrastructure/providers/aiSdkProviderBase';
import { fetchOpenAIStyleModels } from '@/infrastructure/providers/modelDiscovery';
import {
  getDefaultXaiBaseUrl,
  resolveBaseUrlWithDefault,
} from '@/infrastructure/providers/config/baseUrl';
import { getProviderDefaults } from '@/infrastructure/providers/config/providerConfig';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import { toResponseInputMessages } from '@/infrastructure/providers/responsesShared';
import { resolveXaiModelForReasoning } from '@/infrastructure/providers/reasoningControl';
import type { OpenAIRequestMode, ProviderChat } from '@/infrastructure/providers/types';
import { toModelMessages } from '@/infrastructure/providers/aiSdkProviderMessages';
import { resolveProviderExecutionTools } from '@/infrastructure/providers/providerExecutionRuntime';
import {
  createProviderTextExecution,
  streamProviderTextExecution,
} from '@/infrastructure/providers/aiSdkProviderExecution';
import { providerHttpFetch } from '@/infrastructure/network/proxyFetch';
import { AISdkProviderStateBase } from '@/infrastructure/providers/aiSdkProviderState';

export const XAI_PROVIDER_ID: ProviderId = 'xai';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const ensureV1BaseUrl = (baseUrl: string): string => {
  const normalized = trimTrailingSlash(baseUrl.trim());
  return /\/v1$/i.test(normalized) ? normalized : `${normalized}/v1`;
};

class XAIProvider extends AISdkProviderStateBase implements ProviderChat {
  private requestMode: OpenAIRequestMode = 'chat_completions';
  private previousResponseId?: string;

  constructor() {
    const { defaultModel, defaultApiKey, defaultBaseUrl } = getProviderDefaults(XAI_PROVIDER_ID);
    super({
      id: XAI_PROVIDER_ID,
      defaultModel,
      defaultApiKey,
      defaultBaseUrl: defaultBaseUrl ?? getDefaultXaiBaseUrl(),
      missingApiKeyError: 'Missing XAI_API_KEY',
      logLabel: 'xAI',

      supportsBaseUrl: true,
      supportsCustomHeaders: false,
      providerName: XAI_PROVIDER_ID,
    });
  }

  protected override resolveBaseUrl(baseUrl?: string): string {
    return ensureV1BaseUrl(resolveBaseUrlWithDefault(baseUrl, getDefaultXaiBaseUrl));
  }

  protected override buildFetch() {
    return providerHttpFetch;
  }

  protected override onProviderStateChanged(kind: string): void {
    if (
      kind === 'modelName' ||
      kind === 'systemPrompt' ||
      kind === 'apiKey' ||
      kind === 'baseUrl'
    ) {
      this.previousResponseId = undefined;
    }
  }

  private invalidateResponseState(): void {
    this.previousResponseId = undefined;
  }

  getRequestMode(): OpenAIRequestMode {
    return this.requestMode;
  }

  setRequestMode(mode: OpenAIRequestMode): void {
    this.requestMode = mode;
    this.invalidateResponseState();
  }

  override resetChat(): void {
    super.resetChat();
    this.previousResponseId = undefined;
  }

  override async startChatWithHistory(messages: ChatMessage[]): Promise<void> {
    await super.startChatWithHistory(messages);
    this.previousResponseId = undefined;
  }

  private createSdkProvider(): XaiProvider {
    const apiKey = this.resolveApiKey();
    if (!apiKey) {
      throw new Error('Missing XAI_API_KEY');
    }

    return createXai({
      apiKey,
      baseURL: this.resolveTransportBaseUrl(this.baseUrl),
      fetch: this.buildRuntimeFetch(),
    });
  }

  async listModels() {
    const apiKey = this.resolveApiKey();
    if (!apiKey) {
      throw new Error('Missing XAI_API_KEY');
    }
    const baseUrl = this.resolveTransportBaseUrl(this.baseUrl);
    if (!baseUrl) {
      return [];
    }

    return fetchOpenAIStyleModels({
      baseUrl,
      apiKey,
      fetcher: this.buildRuntimeFetch(),
    });
  }

  private buildChatProviderOptions(
    _emitReasoning: boolean,
    requestPolicy?: RequestPolicy
  ): Record<string, Record<string, unknown>> | undefined {
    return buildProviderOptionsRecord(['xai'], {
      ...((requestPolicy?.toolParallelism ?? 1) > 1
        ? {
            parallel_function_calling: true,
          }
        : {}),
    });
  }

  private buildResponsesProviderOptions(
    _emitReasoning: boolean,
    _requestPolicy?: RequestPolicy
  ): Record<string, Record<string, unknown>> | undefined {
    return buildProviderOptionsRecord(['xai'], {
      ...(this.previousResponseId
        ? {
            previousResponseId: this.previousResponseId,
          }
        : {}),
    });
  }

  async *sendMessageStream(
    message: ChatPromptInput,
    signal?: AbortSignal,
    requestPolicy?: RequestPolicy
  ): AsyncGenerator<string, void, unknown> {
    const execution = createProviderTextExecution({
      state: this.createTextExecutionState(this.providerName, this.reasoningPreference.enabled),
      message,
    });
    const { promptText, emitReasoning, nextHistory, runtime } = execution;
    const requestModelName = resolveXaiModelForReasoning(this.modelName, emitReasoning);

    try {
      const provider = this.createSdkProvider();

      if (this.requestMode === 'responses') {
        const responseMessages = this.previousResponseId
          ? [{ role: 'user' as const, content: promptText }]
          : toResponseInputMessages(
              nextHistory.map((item) => ({
                role: item.role,
                text: getMessageText(item),
                attachments: getMessageAttachments(item),
                isError: item.isError,
              })),
              this.systemPrompt
            );
        const tools = await resolveProviderExecutionTools({
          requestPolicy,
          runtime,
          deferredToolProvider: 'xai',
          messages: nextHistory,
        });

        yield* streamProviderTextExecution({
          logLabel: 'xAI',
          maxRetries: 0,
          signal,
          emitReasoning,
          providerId: this.getId(),
          nextHistory,
          requestPolicy,
          commitHistory: this.setHistoryWithModelResponse.bind(this),
          onCompleted: (streamed) => {
            this.previousResponseId = streamed.lastResponseId ?? this.previousResponseId;
          },
          streamOptions: {
            model: provider.responses(requestModelName),
            messages: responseMessages as any,
            tools: tools as any,
            providerOptions: this.buildResponsesProviderOptions(
              emitReasoning,
              requestPolicy
            ) as any,
          },
        });
        return;
      }

      const tools = await resolveProviderExecutionTools({
        requestPolicy,
        runtime,
        messages: nextHistory,
      });

      yield* streamProviderTextExecution({
        logLabel: 'xAI',
        maxRetries: 0,
        signal,
        emitReasoning,
        providerId: this.getId(),
        nextHistory,
        requestPolicy,
        commitHistory: this.setHistoryWithModelResponse.bind(this),
        streamOptions: {
          model: provider.chat(requestModelName),
          system: this.systemPrompt,
          messages: toModelMessages(nextHistory),
          tools: tools as any,
          providerOptions: this.buildChatProviderOptions(emitReasoning, requestPolicy) as any,
        },
      });
    } catch (error) {
      console.error('Error in xAI stream:', error);
      throw error;
    }
  }
}

export const createProviderInstance = (): ProviderChat => new XAIProvider();
