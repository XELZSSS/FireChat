import { ChatMessage } from '@/shared/types/chat';
import { ProviderChat } from '@/infrastructure/providers/types';

type HistorySyncRequest = {
  provider: ProviderChat;
  messages: ChatMessage[];
};

export class ProviderHistorySyncController {
  private generation = 0;
  private latestRequest: HistorySyncRequest | null = null;
  private reconcilePromise: Promise<void> | null = null;
  private reconciledGeneration = 0;

  reset(): void {
    this.generation += 1;
    this.reconciledGeneration = this.generation;
    this.latestRequest = null;
  }

  recordRequest(provider: ProviderChat, messages: ChatMessage[]): number {
    this.latestRequest = { provider, messages };
    this.generation += 1;
    return this.generation;
  }

  shouldReconcile(generation: number, provider: ProviderChat, messages: ChatMessage[]): boolean {
    return (
      generation !== this.generation ||
      this.latestRequest?.provider !== provider ||
      this.latestRequest?.messages !== messages
    );
  }

  async reconcileLatest(): Promise<void> {
    if (this.reconcilePromise) {
      await this.reconcilePromise;
      return;
    }

    const latestRequest = this.latestRequest;
    if (!latestRequest) {
      return;
    }

    this.reconcilePromise = (async () => {
      while (this.latestRequest && this.reconciledGeneration !== this.generation) {
        const snapshot = this.latestRequest;
        const snapshotGeneration = this.generation;
        await snapshot.provider.startChatWithHistory(snapshot.messages);
        this.reconciledGeneration = snapshotGeneration;
      }
    })().finally(() => {
      this.reconcilePromise = null;
    });

    await this.reconcilePromise;
  }
}
