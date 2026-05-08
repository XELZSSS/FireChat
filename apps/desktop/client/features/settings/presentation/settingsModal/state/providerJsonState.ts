import type { ProviderJsonConfig } from '@client/features/settings/infrastructure/providerJsonConfig';
import { applyProviderJsonToSettings } from '@client/features/settings/infrastructure/providerJsonConfig';
import type { OpenAIRequestMode } from '@/infrastructure/providers/types';
import type { ImageGenerationSettings } from '@/infrastructure/providers/imageGenerationSettings';

type ProviderJsonStateActions = {
  onModelNameChange: (value: string) => void;
  onSystemPromptChange: (value: string) => void;
  onImageModelNameChange: (value: string) => void;
  onImageGenerationChange: (value: ImageGenerationSettings) => void;
  onApiKeyChange: (value: string) => void;
  onRequestModeChange: (value: OpenAIRequestMode) => void;
  onBaseUrlChange: (value: string) => void;
  onAddCustomHeader: () => void;
  onSetCustomHeaderKey: (index: number, value: string) => void;
  onSetCustomHeaderValue: (index: number, value: string) => void;
  onRemoveCustomHeader: (index: number) => void;
  onProviderConfigJsonTextChange: (value: string) => void;
};

const replaceCustomHeaders = (
  currentHeaders: Array<{ key: string; value: string }>,
  nextHeaders: Array<{ key: string; value: string }>,
  {
    onAddCustomHeader,
    onSetCustomHeaderKey,
    onSetCustomHeaderValue,
    onRemoveCustomHeader,
  }: Pick<
    ProviderJsonStateActions,
    'onAddCustomHeader' | 'onSetCustomHeaderKey' | 'onSetCustomHeaderValue' | 'onRemoveCustomHeader'
  >
) => {
  for (let index = currentHeaders.length - 1; index >= 0; index -= 1) {
    onRemoveCustomHeader(index);
  }

  for (const _header of nextHeaders) {
    onAddCustomHeader();
  }

  for (const [index, header] of nextHeaders.entries()) {
    onSetCustomHeaderKey(index, header.key);
    onSetCustomHeaderValue(index, header.value);
  }
};

export const applyProviderJsonToFormState = ({
  providerJson,
  currentHeaders,
  actions,
}: {
  providerJson: ProviderJsonConfig;
  currentHeaders: Array<{ key: string; value: string }>;
  actions: ProviderJsonStateActions;
}) => {
  const nextSettings = applyProviderJsonToSettings(providerJson);

  actions.onModelNameChange(nextSettings.modelName ?? '');
  actions.onSystemPromptChange(nextSettings.systemPrompt ?? '');
  actions.onImageModelNameChange(nextSettings.imageModelName ?? '');
  if (nextSettings.imageGeneration) {
    actions.onImageGenerationChange(nextSettings.imageGeneration);
  }
  actions.onApiKeyChange(nextSettings.apiKey ?? '');
  if (nextSettings.requestMode) {
    actions.onRequestModeChange(nextSettings.requestMode);
  }
  actions.onBaseUrlChange(nextSettings.baseUrl ?? '');

  replaceCustomHeaders(currentHeaders, nextSettings.customHeaders ?? [], actions);
  actions.onProviderConfigJsonTextChange(`${JSON.stringify(providerJson, null, 2)}\n`);
};
