import type { ProviderJsonConfig } from '@client/features/settings/infrastructure/providerJsonConfig';
import { applyProviderJsonToSettings } from '@client/features/settings/infrastructure/providerJsonConfig';
import type { ProviderJsonStateActions } from '@client/features/settings/presentation/settingsModal/types/providerJsonTypes';

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
  actions.onApiKeyChange(nextSettings.apiKey ?? '');
  if (nextSettings.requestMode) {
    actions.onRequestModeChange(nextSettings.requestMode);
  }
  actions.onBaseUrlChange(nextSettings.baseUrl ?? '');

  replaceCustomHeaders(currentHeaders, nextSettings.customHeaders ?? [], actions);
  actions.onProviderConfigJsonTextChange(`${JSON.stringify(providerJson, null, 2)}\n`);
};
