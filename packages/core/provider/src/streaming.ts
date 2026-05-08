export type ProviderStreamResult = {
  fullResponse: string;
  fullReasoning: string;
  lastResponseId?: string;
};

export type SdkStreamTextResult = {
  fullStream: AsyncIterable<unknown>;
};

export type ProviderRuntimeToolInput = {
  requestPolicy?: unknown;
  runtime: {
    tavilyConfig?: unknown;
    searchEnabled?: boolean;
  };
  hostedSearchTool?: unknown;
  hostedToolSearchTool?: unknown;
  deferredToolProvider?: string;
  additionalTools?: Record<string, unknown>;
};
