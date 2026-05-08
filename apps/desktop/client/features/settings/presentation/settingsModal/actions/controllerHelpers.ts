import { MAX_TOOL_CALL_ROUNDS, MIN_TOOL_CALL_ROUNDS } from '@/infrastructure/providers/utils';
import type { SaveSettingsPayload } from '@client/features/settings/domain/settingsTypes';
import type { ProviderSettings } from '@/infrastructure/providers/defaults';
import type { SettingsModalState } from '@client/features/settings/presentation/settingsModal/state/reducer';

const clampToolCallRounds = (value: number): number =>
  Math.min(Math.max(value, MIN_TOOL_CALL_ROUNDS), MAX_TOOL_CALL_ROUNDS);

export const normalizeToolCallRounds = (value: string): string => {
  if (!/^\d+$/.test(value.trim())) return '';
  const parsed = Number.parseInt(value, 10);
  return String(clampToolCallRounds(parsed));
};

export const buildProviderSettingsPayload = (
  source: SettingsModalState['provider']
): ProviderSettings => ({
  modelName: source.modelName,
  systemPrompt: source.systemPrompt,
  imageModelName: source.imageModelName,
  apiKey: source.apiKey,
  requestMode: source.requestMode,
  baseUrl: source.baseUrl,
  customHeaders: source.customHeaders.map((header) => ({ ...header })),
  tavily: { ...source.tavily },
  openAdapterTools: { ...source.openAdapterTools },
});

export const buildSettingsSavePayload = (state: SettingsModalState): SaveSettingsPayload => ({
  providerId: state.provider.providerId,
  providerSettings: buildProviderSettingsPayload(state.provider),
  app: { ...state.app },
  interfaceLayoutConfigText: state.ui.interfaceLayoutConfigText,
  providerConfigJsonText: state.ui.providerConfigJsonText,
});

