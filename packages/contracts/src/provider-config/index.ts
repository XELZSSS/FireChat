export type ProviderTransport = 'openai' | 'openai-compatible';

type ProviderConfigSource = 'builtin' | 'custom';

type ProviderConfigOptions = {
  baseURL?: string;
  requestMode?: 'chat_completions' | 'responses';
  systemPrompt?: string;
};

export type ProviderConfigModelEntry = {
  label?: string;
  group?: string;
  description?: string;
  limit?: {
    context?: number;
    output?: number;
  };
};

export type ProviderConfigEntry = {
  source?: ProviderConfigSource;
  transport?: ProviderTransport;
  label?: string;
  enabled?: boolean;
  icon?: string;
  defaultModel?: string;
  options?: ProviderConfigOptions;
  models?: Record<string, ProviderConfigModelEntry>;
};

export type ProviderConfigFile = {
  $schema?: string;
  providers?: Record<string, ProviderConfigEntry>;
  [key: string]: unknown;
};

export type ProviderAuthEntry = {
  apiKey?: string;
  headers?: Record<string, string>;
};

export type ProviderAuthFile = {
  $schema?: string;
  providers?: Record<string, ProviderAuthEntry>;
  [key: string]: unknown;
};

export type ProviderFileSnapshot = {
  config: ProviderConfigFile;
  auth: ProviderAuthFile;
};
