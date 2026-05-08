import { ChatMessage, ChatPromptInput, ProviderId, Role } from '@/shared/types/chat';
import { buildMessagePromptContent } from '@/shared/utils/chatAttachments';
import { buildMessageParts } from '@/shared/utils/chatMessageParts';
import { buildGeneratedImagesMetadataFromStreamResult } from '@/infrastructure/providers/providerImageGenerationRuntime';
import type { ProviderResponseMetadata } from '@/infrastructure/providers/types';
import { buildRuntimeSystemPrompt } from '@/infrastructure/providers/runtimeContext';

export abstract class OpenAIStyleProviderBase {
  protected history: ChatMessage[] = [];
  protected systemPrompt = '';
  private pendingResponseMetadata?: ProviderResponseMetadata;

  protected patchPendingResponseMetadata(updates?: Partial<ProviderResponseMetadata>): void {
    if (!updates) {
      return;
    }

    const nextMetadata = {
      ...(this.pendingResponseMetadata ?? {}),
      ...updates,
    };

    if (Object.keys(nextMetadata).length === 0) {
      return;
    }

    this.pendingResponseMetadata = nextMetadata;
  }

  protected async patchGeneratedImagesFromResult(result: {
    staticToolResults: PromiseLike<unknown>;
  }): Promise<void> {
    this.patchPendingResponseMetadata(await buildGeneratedImagesMetadataFromStreamResult(result));
  }

  consumePendingResponseMetadata(): ProviderResponseMetadata | undefined {
    const metadata = this.pendingResponseMetadata;
    this.pendingResponseMetadata = undefined;
    return metadata;
  }

  protected createHistoryMessage(
    idPrefix: string,
    role: Role.User | Role.Model,
    text: string,
    attachments?: import('@/shared/types/chat').ChatAttachment[]
  ): ChatMessage {
    const messageId = `${idPrefix}-${Date.now()}`;
    return {
      id: messageId,
      role,
      parts: buildMessageParts({
        messageId,
        text,
        attachments,
      }),
      timestamp: Date.now(),
    };
  }

  protected createHistoryModelMessage(
    idPrefix: string,
    text: string,
    reasoning?: string
  ): ChatMessage {
    const messageId = `${idPrefix}-${Date.now()}`;
    return {
      id: messageId,
      role: Role.Model,
      parts: buildMessageParts({
        messageId,
        text,
        reasoning: reasoning || undefined,
        reasoningStatus: reasoning ? 'completed' : undefined,
      }),
      timestamp: Date.now(),
    };
  }

  protected createNextHistory(providerId: ProviderId, message: ChatPromptInput): ChatMessage[] {
    return [
      ...this.history,
      this.createHistoryMessage(`${providerId}-user`, Role.User, message.text, message.attachments),
    ];
  }

  protected setHistoryWithModelResponse(
    providerId: ProviderId,
    nextHistory: ChatMessage[],
    text: string,
    reasoning?: string
  ): void {
    this.history = [
      ...nextHistory,
      this.createHistoryModelMessage(`${providerId}-model`, text, reasoning),
    ];
  }

  protected shouldEmitReasoning(reasoningEnabled: boolean, message: string): boolean {
    return reasoningEnabled && message.trim().length > 0;
  }

  protected setTrimmedModelName(
    currentModelName: string,
    nextModelName: string,
    apply: (modelName: string) => void
  ): void {
    const normalizedModelName = nextModelName.trim();
    if (normalizedModelName !== currentModelName) {
      apply(normalizedModelName);
    }
  }

  protected buildMessages(
    nextHistory: ChatMessage[]
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    return [
      { role: 'system' as const, content: buildRuntimeSystemPrompt(this.systemPrompt) },
      ...nextHistory
        .filter((msg) => !msg.isError)
        .map((msg) => ({
          role: msg.role === Role.User ? ('user' as const) : ('assistant' as const),
          content: buildMessagePromptContent(msg),
        })),
    ];
  }

  getSystemPrompt(): string | undefined {
    return this.systemPrompt;
  }

  setSystemPrompt(systemPrompt?: string): void {
    this.systemPrompt = systemPrompt?.trim() ?? '';
  }

  resetChat(): void {
    this.history = [];
    this.pendingResponseMetadata = undefined;
  }

  async startChatWithHistory(messages: ChatMessage[]): Promise<void> {
    this.history = messages.filter((msg) => !msg.isError);
    this.pendingResponseMetadata = undefined;
  }
}
