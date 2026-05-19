import { ChatMessage, ChatPromptInput, Citation, ProviderId } from '@/shared/types/chat';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type { OpenAdapterToolSettings } from '@/infrastructure/providers/openadapterToolConfig';

export type ProviderResponseMetadata = {
  citations?: Citation[];
  statusCode?: number;
  upstreamRequestId?: string;
  responseId?: string;
};

export type ReasoningLevel = 'low' | 'medium' | 'high' | 'xhigh';

export type ProviderReasoningPreference = {
  enabled: boolean;
  level?: ReasoningLevel;
};

export type OpenAIRequestMode = 'chat_completions' | 'responses';

export type ProviderModelItem = {
  id: string;
  name: string;
  group?: string;
  description?: string;
};

export interface ProviderChat {
  getId(): ProviderId;
  getModelName(): string;
  setModelName(model: string): void;
  getSystemPrompt?(): string | undefined;
  setSystemPrompt?(systemPrompt?: string): void;
  getApiKey(): string | undefined;
  setApiKey(apiKey?: string): void;
  getReasoningPreference?(): ProviderReasoningPreference | undefined;
  setReasoningPreference?(preference: ProviderReasoningPreference): void;
  getRequestMode?(): OpenAIRequestMode | undefined;
  setRequestMode?(mode: OpenAIRequestMode): void;
  getBaseUrl?(): string | undefined;
  setBaseUrl?(baseUrl?: string): void;
  getCustomHeaders?(): Array<{ key: string; value: string }> | undefined;
  setCustomHeaders?(headers: Array<{ key: string; value: string }>): void;
  getOpenAdapterToolSettings?(): OpenAdapterToolSettings | undefined;
  setOpenAdapterToolSettings?(settings: OpenAdapterToolSettings): void;
  consumePendingResponseMetadata?(): ProviderResponseMetadata | undefined;
  listModels?(): Promise<ProviderModelItem[]>;
  resetChat(): void;
  startChatWithHistory(messages: ChatMessage[]): Promise<void>;
  sendMessageStream(
    message: ChatPromptInput,
    signal?: AbortSignal,
    requestPolicy?: RequestPolicy
  ): AsyncGenerator<string, void, unknown>;
}

export interface ProviderDefinition {
  id: ProviderId;
  models: string[];
  defaultModel: string;
  create(): ProviderChat;
}
