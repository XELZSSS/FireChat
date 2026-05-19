import { ChatMessage, ChatPromptInput, ChatSession, ProviderId } from '@/shared/types/chat';
import { ProviderSettings } from '@/infrastructure/providers/defaults';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import { ProviderRouter } from '@/infrastructure/providers/router';
import {
  OpenAIRequestMode,
  ProviderReasoningPreference,
  ProviderResponseMetadata,
  ReasoningLevel,
} from '@/infrastructure/providers/types';
import { ProviderChat } from '@/infrastructure/providers/types';
import { ProviderHistorySyncController } from '@client/features/chat/application/runtime/providerHistorySync';
import { applyProviderSettingsSnapshot } from '@client/features/chat/application/runtime/providerRuntimeSync';
export type ConversationContext = {
  providerId: ProviderId;
  modelName: string;
};

export class ProviderRuntime {
  private readonly router: ProviderRouter;
  private readonly historySync = new ProviderHistorySyncController();
  private provider: ProviderChat;
  private activeSessionId = '';
  private reasoningPreference: ProviderReasoningPreference = { enabled: false, level: 'medium' };
  private requestMode: OpenAIRequestMode = 'chat_completions';

  constructor(initialProviderId: ProviderId) {
    this.router = new ProviderRouter(initialProviderId);
    this.provider = this.router.getActiveProvider();
  }

  getProviderId(): ProviderId {
    return this.provider.getId();
  }

  getConversationContext(): ConversationContext {
    return {
      providerId: this.provider.getId(),
      modelName: this.provider.getModelName(),
    };
  }

  private resetHistorySyncState(): void {
    this.historySync.reset();
  }

  setActiveSessionContext(sessionId: string): void {
    const nextSessionId = sessionId.trim();
    if (this.activeSessionId !== nextSessionId) {
      this.resetHistorySyncState();
    }

    this.activeSessionId = nextSessionId;
  }

  private resolveChatProvider(): ProviderChat {
    return this.provider;
  }

  applyConversationContext(
    providerId: ProviderId,
    modelName: string,
    settings: ProviderSettings
  ): void {
    this.applyProviderSettings(providerId, settings);

    const resolvedModelName =
      modelName.trim() || settings?.modelName?.trim() || this.provider.getModelName();
    if (resolvedModelName !== this.provider.getModelName()) {
      this.provider.setModelName(resolvedModelName);
    }
  }

  getModelName(): string {
    return this.provider.getModelName();
  }

  getApiKey(): string | undefined {
    return this.provider.getApiKey();
  }

  setReasoningEnabled(enabled: boolean): boolean {
    return this.setReasoningPreference({
      ...this.reasoningPreference,
      enabled,
    });
  }

  setReasoningLevel(level: ReasoningLevel): boolean {
    return this.setReasoningPreference({
      ...this.reasoningPreference,
      level,
    });
  }

  setReasoningPreference(preference: ProviderReasoningPreference): boolean {
    const nextPreference: ProviderReasoningPreference = {
      enabled: preference.enabled,
      level: preference.level ?? 'medium',
    };

    if (
      this.reasoningPreference.enabled === nextPreference.enabled &&
      this.reasoningPreference.level === nextPreference.level
    ) {
      return false;
    }

    this.reasoningPreference = nextPreference;
    this.provider.setReasoningPreference?.(this.reasoningPreference);
    return true;
  }

  applyProviderSettings(providerId: ProviderId, settings: ProviderSettings): void {
    if (this.provider.getId() !== providerId) {
      this.resetHistorySyncState();
      this.provider = this.router.setActiveProvider(providerId);
    }

    const provider = this.provider;
    this.requestMode = applyProviderSettingsSnapshot({
      provider,
      settings,
      reasoningPreference: this.reasoningPreference,
      requestMode: this.requestMode,
    });
  }

  resetChat(): void {
    this.resetHistorySyncState();
    this.provider.resetChat();
  }

  async startChatWithHistory(messages: ChatMessage[]): Promise<void> {
    const provider = this.resolveChatProvider();
    const generation = this.historySync.recordRequest(provider, messages);

    await provider.startChatWithHistory(messages);

    if (this.historySync.shouldReconcile(generation, provider, messages)) {
      await this.historySync.reconcileLatest();
    }
  }

  async *sendMessageStream(
    message: ChatPromptInput,
    signal?: AbortSignal,
    requestPolicy?: RequestPolicy
  ): AsyncGenerator<string, void, unknown> {
    const provider = this.resolveChatProvider();
    yield* provider.sendMessageStream(message, signal, requestPolicy);
  }

  consumePendingResponseMetadata(): ProviderResponseMetadata | undefined {
    return this.resolveChatProvider().consumePendingResponseMetadata?.();
  }
}
