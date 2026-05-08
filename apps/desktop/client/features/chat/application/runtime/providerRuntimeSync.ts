import { TavilyConfig } from '@/shared/types/chat';
import type { ProviderSettings } from '@/infrastructure/providers/defaults';
import { createDefaultOpenAdapterToolSettings } from '@/infrastructure/providers/openadapterToolConfig';
import {
  OpenAIRequestMode,
  ProviderChat,
  ProviderReasoningPreference,
} from '@/infrastructure/providers/types';
import { areComparableValuesEqual } from '@/shared/utils/comparable';

const isStructuredEqual = <T>(left: T, right: T): boolean => {
  return areComparableValuesEqual(left, right);
};

const DEFAULT_REASONING_PREFERENCE: ProviderReasoningPreference = {
  enabled: false,
  level: 'medium',
};

const isReasoningPreferenceEqual = (
  left?: ProviderReasoningPreference,
  right?: ProviderReasoningPreference
): boolean =>
  Boolean(left?.enabled) === Boolean(right?.enabled) &&
  (left?.level ?? 'medium') === (right?.level ?? 'medium');

const syncProviderValue = <T>(
  currentValue: T,
  nextValue: T,
  apply: (value: T) => void,
  isEqual: (left: T, right: T) => boolean = Object.is
): void => {
  if (isEqual(currentValue, nextValue)) {
    return;
  }

  apply(nextValue);
};

type ApplyProviderSettingsOptions = {
  provider: ProviderChat;
  settings: ProviderSettings;
  searchEnabled: boolean;
  reasoningPreference: ProviderReasoningPreference;
  requestMode: OpenAIRequestMode;
};

export const applyProviderSettingsSnapshot = ({
  provider,
  settings,
  searchEnabled,
  reasoningPreference,
  requestMode,
}: ApplyProviderSettingsOptions): OpenAIRequestMode => {
  const nextRequestMode = settings?.requestMode ?? requestMode;

  syncProviderValue(provider.getApiKey(), settings?.apiKey, (nextApiKey) => {
    provider.setApiKey(nextApiKey);
  });

  if (provider.setSystemPrompt) {
    syncProviderValue(provider.getSystemPrompt?.() ?? '', settings?.systemPrompt ?? '', (next) =>
      provider.setSystemPrompt?.(next)
    );
  }

  if (provider.setImageModelName) {
    syncProviderValue(
      provider.getImageModelName?.(),
      settings?.imageModelName,
      (nextImageModelName) => provider.setImageModelName?.(nextImageModelName)
    );
  }

  if (provider.setImageGenerationSettings) {
    syncProviderValue(
      provider.getImageGenerationSettings?.(),
      settings?.imageGeneration,
      (nextImageGenerationSettings) =>
        provider.setImageGenerationSettings?.(nextImageGenerationSettings),
      isStructuredEqual
    );
  }

  if (provider.setBaseUrl) {
    syncProviderValue(provider.getBaseUrl?.(), settings?.baseUrl, (nextBaseUrl) =>
      provider.setBaseUrl?.(nextBaseUrl)
    );
  }

  if (provider.setCustomHeaders) {
    syncProviderValue(
      provider.getCustomHeaders?.() ?? [],
      settings?.customHeaders ?? [],
      (nextHeaders) => provider.setCustomHeaders?.(nextHeaders),
      isStructuredEqual
    );
  }

  if (provider.setTavilyConfig) {
    syncProviderValue(
      provider.getTavilyConfig?.(),
      searchEnabled ? settings?.tavily : undefined,
      (nextTavily) => provider.setTavilyConfig?.(nextTavily),
      isStructuredEqual<TavilyConfig | undefined>
    );
  }

  if (provider.setOpenAdapterToolSettings) {
    syncProviderValue(
      provider.getOpenAdapterToolSettings?.() ?? createDefaultOpenAdapterToolSettings(),
      settings?.openAdapterTools ?? createDefaultOpenAdapterToolSettings(),
      (nextSettings) => provider.setOpenAdapterToolSettings?.(nextSettings),
      isStructuredEqual
    );
  }

  if (provider.setReasoningPreference) {
    syncProviderValue(
      provider.getReasoningPreference?.() ?? DEFAULT_REASONING_PREFERENCE,
      reasoningPreference,
      (nextPreference) => provider.setReasoningPreference?.(nextPreference),
      isReasoningPreferenceEqual
    );
  }

  if (provider.setRequestMode) {
    syncProviderValue(
      provider.getRequestMode?.() ?? nextRequestMode,
      nextRequestMode,
      (nextMode) => provider.setRequestMode?.(nextMode),
      Object.is
    );
  }

  return nextRequestMode;
};
