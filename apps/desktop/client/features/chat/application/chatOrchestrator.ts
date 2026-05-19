import { ChatMessage, ChatPromptInput, ProviderId } from '@/shared/types/chat';
import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import { ProviderResponseMetadata } from '@/infrastructure/providers/types';
import { ProviderSettings } from '@/infrastructure/providers/defaults';
import { ProviderSettingsRepository } from '@client/features/chat/application/providerSettingsRepository';
import {
  ConversationContext,
  ProviderRuntime,
} from '@client/features/chat/application/providerRuntime';
import type { ProviderReasoningPreference, ReasoningLevel } from '@/infrastructure/providers/types';

export class ChatOrchestrator {
  private readonly settingsRepository: ProviderSettingsRepository;
  private readonly runtime: ProviderRuntime;

  constructor(
    settingsRepository: ProviderSettingsRepository = new ProviderSettingsRepository(),
    runtime?: ProviderRuntime
  ) {
    this.settingsRepository = settingsRepository;
    const initialProviderId = this.settingsRepository.getDefaultProviderId();
    this.runtime = runtime ?? new ProviderRuntime(initialProviderId);
    this.applyContextForProvider(initialProviderId);
  }

  private getSettings(providerId: ProviderId): ProviderSettings {
    return this.settingsRepository.getSettings(providerId);
  }

  private applyContextForProvider(providerId: ProviderId, modelName?: string): void {
    const settings = this.getSettings(providerId);
    this.runtime.applyConversationContext(providerId, modelName ?? settings.modelName, settings);
  }

  private syncRuntimeProviderSettings(
    providerId: ProviderId,
    providerSettings?: ProviderSettings,
    conversationModelName?: string
  ): void {
    const resolvedSettings = providerSettings ?? this.getSettings(providerId);
    if (conversationModelName !== undefined) {
      this.runtime.applyConversationContext(providerId, conversationModelName, resolvedSettings);
      return;
    }

    this.runtime.applyProviderSettings(providerId, resolvedSettings);
  }

  private updateAndSyncProviderSettings(
    providerId: ProviderId,
    updates: Partial<ProviderSettings>
  ): ProviderSettings {
    const previous = this.getSettings(providerId);
    const next = this.settingsRepository.updateSettings(providerId, updates);

    if (providerId === this.getProviderId()) {
      const shouldSyncConversationModel =
        updates.modelName !== undefined && next.modelName !== previous.modelName;

      this.syncRuntimeProviderSettings(
        providerId,
        next,
        shouldSyncConversationModel ? next.modelName : undefined
      );
    }

    return next;
  }

  getProviderId(): ProviderId {
    return this.runtime.getProviderId();
  }

  getDefaultProviderId(): ProviderId {
    return this.settingsRepository.getDefaultProviderId();
  }

  getConversationContext(): ConversationContext {
    return this.runtime.getConversationContext();
  }

  setActiveSessionContext(sessionId: string): void {
    this.runtime.setActiveSessionContext(sessionId);
  }

  setDefaultProvider(id: ProviderId): void {
    this.settingsRepository.persistDefaultProviderId(id);
  }

  activateConversationContext(context: ConversationContext): void {
    this.applyContextForProvider(context.providerId, context.modelName);
  }

  activateDefaultConversationContext(): void {
    this.applyContextForProvider(this.getDefaultProviderId());
  }

  getModelName(): string {
    return this.runtime.getModelName();
  }

  setReasoningEnabled(enabled: boolean): void {
    this.runtime.setReasoningEnabled(enabled);
  }

  setReasoningLevel(level: ReasoningLevel): void {
    this.runtime.setReasoningLevel(level);
  }

  setReasoningPreference(preference: ProviderReasoningPreference): void {
    this.runtime.setReasoningPreference(preference);
  }

  setDefaultModelName(providerId: ProviderId, model: string): void {
    this.updateAndSyncProviderSettings(providerId, { modelName: model });
  }

  getApiKey(): string | undefined {
    return this.runtime.getApiKey();
  }

  setApiKey(apiKey?: string): void {
    this.updateAndSyncProviderSettings(this.getProviderId(), { apiKey });
  }

  getProviderSettings(providerId: ProviderId = this.getProviderId()): ProviderSettings {
    return { ...this.getSettings(providerId) };
  }

  getAllProviderSettings(): Record<ProviderId, ProviderSettings> {
    return this.settingsRepository.getAllSettings();
  }

  updateProviderSettings(
    providerId: ProviderId,
    updates: Partial<ProviderSettings>
  ): ProviderSettings {
    return this.updateAndSyncProviderSettings(providerId, updates);
  }

  replaceAllProviderSettings(
    settings: Record<ProviderId, ProviderSettings>
  ): Record<ProviderId, ProviderSettings> {
    const nextSettings = this.settingsRepository.replaceAllSettings(settings);
    const currentProviderId = this.getProviderId();
    const currentSettings = nextSettings[currentProviderId];
    this.syncRuntimeProviderSettings(currentProviderId, currentSettings, currentSettings.modelName);
    return nextSettings;
  }

  getAvailableProviders(): ProviderId[] {
    return listProviderIds();
  }

  reloadProviderCatalog(): Record<ProviderId, ProviderSettings> {
    const nextSettings = this.settingsRepository.reload();
    const availableProviders = this.getAvailableProviders();
    const defaultProviderId = this.getDefaultProviderId();
    if (!availableProviders.includes(defaultProviderId)) {
      throw new Error(`Default provider "${defaultProviderId}" is unavailable.`);
    }

    const currentContext = this.getConversationContext();
    if (!availableProviders.includes(currentContext.providerId)) {
      throw new Error(`Current provider "${currentContext.providerId}" is unavailable.`);
    }

    const nextProviderId = currentContext.providerId;
    const nextSettingsForProvider = nextSettings[nextProviderId];
    const nextModelName = nextSettingsForProvider?.modelName || currentContext.modelName;

    this.runtime.applyConversationContext(nextProviderId, nextModelName, nextSettingsForProvider);
    return nextSettings;
  }

  resetChat(): void {
    this.runtime.resetChat();
  }

  async startChatWithHistory(messages: ChatMessage[]): Promise<void> {
    await this.runtime.startChatWithHistory(messages);
  }

  async restoreChatWithHistory(messages: ChatMessage[]): Promise<void> {
    await this.startChatWithHistory(messages);
  }

  async *sendMessageStream(
    message: ChatPromptInput,
    signal?: AbortSignal,
    requestPolicy?: RequestPolicy
  ): AsyncGenerator<string, void, unknown> {
    yield* this.runtime.sendMessageStream(message, signal, requestPolicy);
  }

  consumePendingResponseMetadata(): ProviderResponseMetadata | undefined {
    return this.runtime.consumePendingResponseMetadata();
  }
}
