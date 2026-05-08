type BuildProviderModelConfigOptions = {
  envModel?: string;
  defaultModelId: string;
  includeDefaultModelId?: boolean;
};

export const resolveEnvModel = (value: string | undefined, defaultModelId: string): string => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === 'undefined') {
    return defaultModelId;
  }
  return trimmed;
};

export const buildProviderModelConfig = ({
  envModel,
  defaultModelId,
  includeDefaultModelId = true,
}: BuildProviderModelConfigOptions): { defaultModel: string; models: string[] } => {
  const defaultModel = resolveEnvModel(envModel, defaultModelId);
  return {
    defaultModel,
    models: includeDefaultModelId ? [defaultModel] : [],
  };
};
