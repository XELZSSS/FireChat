import { ProviderId } from '@/shared/types/chat';
import { createProvider } from '@/infrastructure/providers/registry';
import { ProviderChat } from '@/infrastructure/providers/types';
import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';

export class ProviderRouter {
  private activeProviderId: ProviderId;
  private activeProvider: ProviderChat;
  private readonly providers = new Map<ProviderId, ProviderChat>();

  private getOrCreateProvider(id: ProviderId): ProviderChat {
    const cached = this.providers.get(id);
    if (cached) {
      return cached;
    }

    const provider = createProvider(id);
    this.providers.set(id, provider);
    return provider;
  }

  constructor(initialProvider: ProviderId = listProviderIds()[0] ?? 'openai') {
    this.activeProviderId = initialProvider;
    this.activeProvider = this.getOrCreateProvider(initialProvider);
  }

  getActiveProviderId(): ProviderId {
    return this.activeProviderId;
  }

  getActiveProvider(): ProviderChat {
    return this.activeProvider;
  }

  setActiveProvider(id: ProviderId): ProviderChat {
    if (id === this.activeProviderId) {
      return this.activeProvider;
    }

    this.activeProviderId = id;
    this.activeProvider = this.getOrCreateProvider(id);
    return this.activeProvider;
  }
}
