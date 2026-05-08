export type ProviderExecutionRequest<Message, ProviderId, Settings> = {
  providerId: ProviderId;
  modelName: string;
  settings: Settings;
  message: Message;
  signal?: AbortSignal;
};

export type ProviderExecutionChunk = {
  type: 'text' | 'reasoning';
  text: string;
};

export type ProviderExecutionResult<Metadata = unknown> = {
  status: 'completed' | 'aborted' | 'error';
  text: string;
  reasoning?: string;
  metadata?: Metadata;
  errorMessage?: string;
};

export interface ProviderExecutor<Request, Metadata = unknown> {
  execute(
    request: Request
  ): AsyncGenerator<ProviderExecutionChunk, ProviderExecutionResult<Metadata>, unknown>;
}

export interface ProviderConfigResolver<ProviderId, Settings, RuntimeConfig> {
  resolve(providerId: ProviderId, settings: Settings): RuntimeConfig;
}
