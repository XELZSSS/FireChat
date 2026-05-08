import { buildMessagePromptContent } from '@/shared/utils/chatAttachments';
import type { ChatMessage, ChatPromptInput, ProviderId } from '@/shared/types/chat';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import {
  createProviderRuntimeState,
  type ProviderRuntimeState,
} from '@/infrastructure/providers/aiSdkProviderState';
import { buildToolSet } from '@/infrastructure/providers/aiSdkProviderTools';
import {
  streamSdkResult,
  type ProviderStreamResult,
} from '@/infrastructure/providers/aiSdkProviderStreaming';
import type { SdkStreamTextResult } from '@provider-core/index';

type ProviderExecutionContextOptions = ProviderRuntimeState & {
  message: ChatPromptInput;
  shouldEmitReasoning: (enabled: boolean, promptText: string) => boolean;
  reasoningEnabled: boolean;
  createNextHistory: (providerId: ProviderId, message: ChatPromptInput) => ChatMessage[];
};

type ProviderExecutionToolsOptions = {
  requestPolicy?: RequestPolicy;
  runtime: ReturnType<typeof createProviderRuntimeState>;
  hostedSearchTool?: unknown;
  hostedToolSearchTool?: unknown;
  deferredToolProvider?: string;
  additionalTools?: Record<string, unknown>;
  messages?: ChatMessage[];
};

type StreamProviderExecutionResultOptions = {
  result: SdkStreamTextResult;
  emitReasoning: boolean;
  providerId: ProviderId;
  nextHistory: ChatMessage[];
  commitHistory: (
    providerId: ProviderId,
    nextHistory: ChatMessage[],
    text: string,
    reasoning?: string
  ) => void;
  rawReasoningExtractor?: (raw: unknown) => string[];
  onCompleted?: (result: ProviderStreamResult) => void | Promise<void>;
};

export const createProviderExecutionContext = ({
  id,
  modelName,
  providerName,
  tavilyConfig,
  supportsTavily,
  supportsCustomHeaders,
  customHeaders,
  message,
  shouldEmitReasoning,
  reasoningEnabled,
  createNextHistory,
}: ProviderExecutionContextOptions) => {
  const promptText = buildMessagePromptContent(message);
  const emitReasoning = shouldEmitReasoning(reasoningEnabled, promptText);

  return {
    promptText,
    emitReasoning,
    nextHistory: createNextHistory(id, message),
    runtime: createProviderRuntimeState({
      id,
      modelName,
      providerName,
      tavilyConfig,
      supportsTavily,
      supportsCustomHeaders,
      customHeaders,
    }),
  };
};

export const resolveProviderExecutionTools = async ({
  requestPolicy,
  runtime,
  hostedSearchTool,
  hostedToolSearchTool,
  deferredToolProvider,
  additionalTools,
  messages,
}: ProviderExecutionToolsOptions): Promise<Record<string, unknown> | undefined> => {
  const tools = await buildToolSet({
    requestPolicy,
    tavilyConfig: runtime.tavilyConfig,
    searchEnabled: runtime.searchEnabled,
    hostedSearchTool,
    hostedToolSearchTool,
    deferredToolProvider,
    messages,
  });

  const mergedTools = {
    ...(tools ?? {}),
    ...(additionalTools ?? {}),
  };

  return Object.keys(mergedTools).length > 0 ? mergedTools : undefined;
};

export const streamProviderExecutionResult = async function* ({
  result,
  emitReasoning,
  providerId,
  nextHistory,
  commitHistory,
  rawReasoningExtractor,
  onCompleted,
}: StreamProviderExecutionResultOptions): AsyncGenerator<string, ProviderStreamResult, unknown> {
  const streamed = yield* streamSdkResult({
    result,
    emitReasoning,
    rawReasoningExtractor,
  });

  await onCompleted?.(streamed);
  commitHistory(providerId, nextHistory, streamed.fullResponse, streamed.fullReasoning);

  return streamed;
};
