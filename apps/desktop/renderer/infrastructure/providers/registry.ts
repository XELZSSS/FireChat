import type { ProviderId } from '@/shared/types/chat';
import type {
  OpenAIRequestMode,
  ProviderChat,
  ProviderDefinition,
  ProviderModelItem,
  ProviderReasoningPreference,
  ProviderResponseMetadata,
} from '@/infrastructure/providers/types';
import type { ChatMessage, ChatPromptInput } from '@/shared/types/chat';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type { HeaderPair } from '@/infrastructure/providers/aiSdkProviderMessages';
import type { OpenAdapterToolSettings } from '@/infrastructure/providers/openadapterToolConfig';
import { BUILTIN_PROVIDER_IDS } from '../../../../shared/provider-ids';
import {
  isCompatibleBuiltInProviderId,
  isSdkStreamBuiltInProviderId,
} from '@/infrastructure/providers/builtInProviderGroups';
import {
  getProviderResolvedConfig,
  getProviderResolvedConfigs,
} from '@/infrastructure/providers/runtime/providerRuntimeCatalog';

const BUILTIN_PROVIDER_ID_SET = new Set<string>(BUILTIN_PROVIDER_IDS as readonly string[]);

type ProviderFactory = () => ProviderChat;
type ProviderFactoryLoader = () => Promise<ProviderFactory>;

type LazyProviderOptions = {
  id: ProviderId;
  defaultModel: string;
  loadFactory: ProviderFactoryLoader;
};

class LazyProvider implements ProviderChat {
  private provider: ProviderChat | null = null;
  private providerPromise: Promise<ProviderChat> | null = null;
  private modelName: string;
  private systemPrompt = '';
  private apiKey?: string;
  private reasoningPreference: ProviderReasoningPreference = { enabled: false, level: 'medium' };
  private requestMode?: OpenAIRequestMode;
  private baseUrl?: string;
  private customHeaders: HeaderPair[] = [];
  private openAdapterToolSettings?: OpenAdapterToolSettings;

  constructor(private readonly options: LazyProviderOptions) {
    this.modelName = options.defaultModel;
  }

  private async loadProvider(): Promise<ProviderChat> {
    if (this.provider) {
      return this.provider;
    }

    if (!this.providerPromise) {
      this.providerPromise = this.options.loadFactory().then((create) => {
        const provider = create();
        this.applyStateToProvider(provider);
        this.provider = provider;
        return provider;
      });
    }

    return this.providerPromise;
  }

  private applyStateToProvider(provider: ProviderChat): void {
    provider.setModelName(this.modelName);
    provider.setSystemPrompt?.(this.systemPrompt);
    provider.setApiKey(this.apiKey);
    provider.setReasoningPreference?.(this.reasoningPreference);
    if (this.requestMode) {
      provider.setRequestMode?.(this.requestMode);
    }
    provider.setBaseUrl?.(this.baseUrl);
    provider.setCustomHeaders?.(this.customHeaders);
    if (this.openAdapterToolSettings) {
      provider.setOpenAdapterToolSettings?.(this.openAdapterToolSettings);
    }
  }

  getId(): ProviderId {
    return this.options.id;
  }

  getModelName(): string {
    return this.modelName;
  }

  setModelName(model: string): void {
    this.modelName = model.trim() || this.modelName;
    this.provider?.setModelName(this.modelName);
  }

  getSystemPrompt(): string | undefined {
    return this.systemPrompt;
  }

  setSystemPrompt(systemPrompt?: string): void {
    this.systemPrompt = systemPrompt?.trim() ?? '';
    this.provider?.setSystemPrompt?.(this.systemPrompt);
  }

  getApiKey(): string | undefined {
    return this.apiKey;
  }

  setApiKey(apiKey?: string): void {
    this.apiKey = apiKey;
    this.provider?.setApiKey(apiKey);
  }

  getReasoningPreference(): ProviderReasoningPreference {
    return this.reasoningPreference;
  }

  setReasoningPreference(preference: ProviderReasoningPreference): void {
    this.reasoningPreference = {
      enabled: preference.enabled,
      level: preference.level ?? 'medium',
    };
    this.provider?.setReasoningPreference?.(this.reasoningPreference);
  }

  getRequestMode(): OpenAIRequestMode | undefined {
    return this.requestMode;
  }

  setRequestMode(mode: OpenAIRequestMode): void {
    this.requestMode = mode;
    this.provider?.setRequestMode?.(mode);
  }

  getBaseUrl(): string | undefined {
    return this.baseUrl;
  }

  setBaseUrl(baseUrl?: string): void {
    this.baseUrl = baseUrl;
    this.provider?.setBaseUrl?.(baseUrl);
  }

  getCustomHeaders(): HeaderPair[] {
    return this.customHeaders;
  }

  setCustomHeaders(headers: HeaderPair[]): void {
    this.customHeaders = headers;
    this.provider?.setCustomHeaders?.(headers);
  }

  getOpenAdapterToolSettings(): OpenAdapterToolSettings | undefined {
    return this.openAdapterToolSettings;
  }

  setOpenAdapterToolSettings(settings: OpenAdapterToolSettings): void {
    this.openAdapterToolSettings = settings;
    this.provider?.setOpenAdapterToolSettings?.(settings);
  }

  consumePendingResponseMetadata(): ProviderResponseMetadata | undefined {
    return this.provider?.consumePendingResponseMetadata?.();
  }

  async listModels(): Promise<ProviderModelItem[]> {
    return (await this.loadProvider()).listModels?.() ?? [];
  }

  resetChat(): void {
    this.provider?.resetChat();
  }

  async startChatWithHistory(messages: ChatMessage[]): Promise<void> {
    await (await this.loadProvider()).startChatWithHistory(messages);
  }

  async *sendMessageStream(
    message: ChatPromptInput,
    signal?: AbortSignal,
    requestPolicy?: RequestPolicy
  ): AsyncGenerator<string, void, unknown> {
    yield* (await this.loadProvider()).sendMessageStream(message, signal, requestPolicy);
  }
}

const loadSpecialProviderFactory = async (id: ProviderId): Promise<ProviderFactory | undefined> => {
  switch (id) {
    case 'openai':
      return (await import('@/infrastructure/providers/openaiProvider')).createProviderInstance;
    case 'openadapter':
      return (await import('@/infrastructure/providers/openadapterProvider'))
        .createProviderInstance;
    case 'opencode':
      return (await import('@/infrastructure/providers/opencodeProvider')).createProviderInstance;
    case 'xai':
      return (await import('@/infrastructure/providers/xaiProvider')).createProviderInstance;
    default:
      return undefined;
  }
};

const loadBuiltInProviderFactory = async (id: ProviderId): Promise<ProviderFactory> => {
  if (isCompatibleBuiltInProviderId(id)) {
    const module = await import('@/infrastructure/providers/builtInCompatibleProviderFactory');
    return () => module.createCompatibleBuiltInProviderInstance(id);
  }

  if (isSdkStreamBuiltInProviderId(id)) {
    const module = await import('@/infrastructure/providers/builtInSdkStreamProviderFactory');
    return () => module.createSdkStreamBuiltInProviderInstance(id);
  }

  const factory = await loadSpecialProviderFactory(id);
  if (!factory) {
    throw new Error(`No built-in provider factory registered for ${id}.`);
  }

  return factory;
};

const createProviderFactory = (id: ProviderId, defaultModel: string): (() => ProviderChat) => {
  getProviderResolvedConfig(id);

  const loadFactory: ProviderFactoryLoader = async () => {
    if (BUILTIN_PROVIDER_ID_SET.has(id)) {
      return loadBuiltInProviderFactory(id);
    }

    const module = await import('@/infrastructure/providers/configurableProvider');
    return () => module.createConfigurableProviderInstance(id);
  };

  return () =>
    new LazyProvider({
      id,
      defaultModel,
      loadFactory,
    });
};

const getDefinitions = (): Record<ProviderId, ProviderDefinition> => {
  const configs = getProviderResolvedConfigs();

  return Object.fromEntries(
    Object.values(configs).map((config) => [
      config.id,
      {
        id: config.id,
        models: config.models,
        defaultModel: config.defaultModel,
        create: createProviderFactory(config.id, config.defaultModel),
      },
    ])
  );
};

export const getProviderDefinition = (id: ProviderId): ProviderDefinition => {
  const definition = getDefinitions()[id];
  if (!definition) {
    throw new Error(`Provider definition not found for ${id}.`);
  }
  return definition;
};

export const createProvider = (id: ProviderId): ProviderChat => getProviderDefinition(id).create();
