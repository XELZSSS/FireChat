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
import { loadAppSettings } from '@/infrastructure/persistence/appSettingsStore';
import { getActiveCliProviderId } from '@/infrastructure/providers/cliProviderSettings';
import type { CliProviderId, CliProviderKey } from '@contracts/desktop';
import {
  createClaudeCodeCliProviderInstance,
  createCodexCliProviderInstance,
} from '@/infrastructure/providers/cliProvider';

export type ConversationContext = {
  providerId: ProviderId;
  modelName: string;
};

const toCliProviderKey = (providerId: CliProviderId): CliProviderKey =>
  providerId === 'codex' ? 'codex' : 'claudeCode';

const cloneCliSessionIds = (
  cliSessionIds: ChatSession['cliSessionIds']
): ChatSession['cliSessionIds'] => (cliSessionIds ? { ...cliSessionIds } : undefined);

export class ProviderRuntime {
  private readonly router: ProviderRouter;
  private readonly historySync = new ProviderHistorySyncController();
  private provider: ProviderChat;
  private cliProvider: ProviderChat | null = null;
  private cliProviderId: CliProviderId | null = null;
  private cliSessionIds: ChatSession['cliSessionIds'];
  private activeSessionId = '';
  private searchEnabled = false;
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

  private createCliProvider(providerId: CliProviderId): ProviderChat {
    return providerId === 'codex'
      ? createCodexCliProviderInstance()
      : createClaudeCodeCliProviderInstance();
  }

  private syncActiveCliSessionId(provider: ProviderChat, providerId: CliProviderId): void {
    const key = toCliProviderKey(providerId);
    const sessionId =
      this.cliSessionIds?.[key] ??
      (providerId === 'claude-code' ? this.activeSessionId : undefined);
    provider.setCliSessionId?.(sessionId);
  }

  private captureActiveCliSessionId(provider: ProviderChat): void {
    if (!this.cliProviderId || provider !== this.cliProvider) {
      return;
    }

    const key = toCliProviderKey(this.cliProviderId);
    const sessionId = provider.getCliSessionId?.()?.trim();
    const nextSessionIds = { ...(this.cliSessionIds ?? {}) };

    if (sessionId) {
      nextSessionIds[key] = sessionId;
    } else {
      delete nextSessionIds[key];
    }

    this.cliSessionIds =
      nextSessionIds.codex || nextSessionIds.claudeCode ? nextSessionIds : undefined;
  }

  setActiveSessionContext(sessionId: string, cliSessionIds?: ChatSession['cliSessionIds']): void {
    const nextSessionId = sessionId.trim();
    if (this.activeSessionId !== nextSessionId) {
      this.resetHistorySyncState();
    }

    this.activeSessionId = nextSessionId;
    this.cliSessionIds = cloneCliSessionIds(cliSessionIds);

    if (this.cliProvider && this.cliProviderId) {
      this.syncActiveCliSessionId(this.cliProvider, this.cliProviderId);
    }
  }

  getCliSessionIds(): ChatSession['cliSessionIds'] {
    return cloneCliSessionIds(this.cliSessionIds);
  }

  private resolveChatProvider(): ProviderChat {
    const activeCliProviderId = getActiveCliProviderId(loadAppSettings().cli);
    if (!activeCliProviderId) {
      if (this.cliProviderId) {
        this.resetHistorySyncState();
      }
      this.cliProvider = null;
      this.cliProviderId = null;
      return this.provider;
    }

    if (!this.cliProvider || this.cliProviderId !== activeCliProviderId) {
      this.resetHistorySyncState();
      this.cliProvider = this.createCliProvider(activeCliProviderId);
      this.cliProviderId = activeCliProviderId;
    }

    this.syncActiveCliSessionId(this.cliProvider, activeCliProviderId);
    return this.cliProvider;
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

  setSearchEnabled(enabled: boolean): boolean {
    if (this.searchEnabled === enabled) {
      return false;
    }
    this.searchEnabled = enabled;
    return true;
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
      searchEnabled: this.searchEnabled,
      reasoningPreference: this.reasoningPreference,
      requestMode: this.requestMode,
    });
  }

  resetChat(): void {
    this.resetHistorySyncState();
    this.cliSessionIds = undefined;
    this.provider.resetChat();
    this.cliProvider?.resetChat();
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
    try {
      yield* provider.sendMessageStream(message, signal, requestPolicy);
    } finally {
      this.captureActiveCliSessionId(provider);
    }
  }

  consumePendingResponseMetadata(): ProviderResponseMetadata | undefined {
    return this.resolveChatProvider().consumePendingResponseMetadata?.();
  }
}
