import { stepCountIs, streamText, type ModelMessage } from 'ai';
import type { ChatPromptInput, ChatMessage, ProviderId } from '@/shared/types/chat';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import { getRequestPolicyToolCallMaxRounds } from '@/infrastructure/providers/requestPolicy';
import type { ProviderResponseMetadata } from '@/infrastructure/providers/types';
import { buildRuntimeSystemPrompt } from '@/infrastructure/providers/runtimeContext';
import type { HeaderPair } from '@/infrastructure/providers/aiSdkProviderMessages';
import {
  createProviderExecutionContext,
  resolveProviderExecutionTools,
  streamProviderExecutionResult,
} from '@/infrastructure/providers/providerExecutionRuntime';

type ProviderExecutionState = {
  id: ProviderId;
  modelName: string;
  providerName: string;
  supportsCustomHeaders: boolean;
  customHeaders: HeaderPair[];
  shouldEmitReasoning: (enabled: boolean, promptText: string) => boolean;
  reasoningEnabled: boolean;
  createNextHistory: (providerId: ProviderId, message: ChatPromptInput) => ChatMessage[];
};

type StreamProviderTextExecutionOptions = {
  logLabel: string;
  maxRetries: number;
  signal?: AbortSignal;
  emitReasoning: boolean;
  providerId: ProviderId;
  nextHistory: ChatMessage[];
  commitHistory: (
    providerId: ProviderId,
    nextHistory: ChatMessage[],
    fullResponse: string,
    fullReasoning?: string
  ) => void;
  rawReasoningExtractor?: (raw: unknown) => string[];
  requestPolicy?: RequestPolicy;
  onCompleted?: (streamed: {
    fullResponse: string;
    fullReasoning: string;
    lastResponseId?: string;
  }) => void;
  onResult?: (payload: {
    result: ReturnType<typeof streamText>;
    streamed: {
      fullResponse: string;
      fullReasoning: string;
      lastResponseId?: string;
    };
  }) => void | Promise<void>;
  streamOptions: Parameters<typeof streamText>[0];
};

export const createProviderTextExecution = ({
  state,
  message,
}: {
  state: ProviderExecutionState;
  message: ChatPromptInput;
}) =>
  createProviderExecutionContext({
    id: state.id,
    modelName: state.modelName,
    providerName: state.providerName,
    supportsCustomHeaders: state.supportsCustomHeaders,
    customHeaders: state.customHeaders,
    message,
    shouldEmitReasoning: state.shouldEmitReasoning,
    reasoningEnabled: state.reasoningEnabled,
    createNextHistory: state.createNextHistory,
  });

export const resolveProviderTextExecutionTools = async ({
  runtime,
  additionalTools,
}: {
  runtime: ReturnType<typeof createProviderExecutionContext>['runtime'];
  additionalTools?: Record<string, unknown>;
}) =>
  resolveProviderExecutionTools({
    runtime,
    additionalTools,
  });

export async function* streamProviderTextExecution({
  logLabel,
  maxRetries,
  signal,
  emitReasoning,
  providerId,
  nextHistory,
  commitHistory,
  rawReasoningExtractor,
  requestPolicy,
  onCompleted,
  onResult,
  streamOptions,
}: StreamProviderTextExecutionOptions): AsyncGenerator<string, ProviderResponseMetadata, unknown> {
  try {
    const result = streamText({
      ...streamOptions,
      system:
        typeof streamOptions.system === 'string'
          ? buildRuntimeSystemPrompt(streamOptions.system)
          : buildRuntimeSystemPrompt(),
      ...(streamOptions.messages?.some((message) => message.role === 'system')
        ? { allowSystemInMessages: true }
        : {}),
      stopWhen:
        streamOptions.stopWhen ?? stepCountIs(getRequestPolicyToolCallMaxRounds(requestPolicy)),
      maxRetries,
      abortSignal: signal,
    });

    const streamed = yield* streamProviderExecutionResult({
      result,
      emitReasoning,
      providerId,
      nextHistory,
      commitHistory,
      rawReasoningExtractor,
      onCompleted,
    });

    await onResult?.({
      result,
      streamed,
    });

    return {
      responseId: streamed.lastResponseId,
    };
  } catch (error) {
    console.error(`Error in ${logLabel} stream:`, error);
    throw error;
  }
}

export type ResponsesPrompt = {
  messages: ModelMessage[];
};
