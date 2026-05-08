import { ProviderId } from '@/shared/types/chat';
import type { AppSettings } from '@/infrastructure/persistence/appSettingsStore';
import type { ProviderSettings } from '@/infrastructure/providers/defaults';

export type ProviderSettingsMap = Record<ProviderId, ProviderSettings>;

export type SaveSettingsPayload = {
  providerId: ProviderId;
  providerSettings: ProviderSettings;
  app: AppSettings;
  interfaceLayoutConfigText: string;
  providerConfigJsonText: string;
};
