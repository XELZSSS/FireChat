import { ProviderId } from '@/shared/types/chat';
import { getDefaultProviderSettings, ProviderSettings } from '@/infrastructure/providers/defaults';
import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import {
  loadDefaultProviderId,
  persistDefaultProviderId,
} from '@/infrastructure/persistence/appSettingsStore';
import {
  applyGlobalTavilyConfig,
  loadProviderSettings,
  normalizeProviderSettingsRecord,
  normalizeProviderSettingsUpdate,
  persistProviderSettings,
} from '@/infrastructure/persistence/providerSettingsStore';

export class ProviderSettingsRepository {
  private settings: Record<ProviderId, ProviderSettings>;

  constructor(initialSettings: Record<ProviderId, ProviderSettings> = loadProviderSettings()) {
    this.settings = initialSettings;
  }

  private resolveAvailableProviderId(providerId: ProviderId): ProviderId {
    const availableProviders = listProviderIds();
    return availableProviders.includes(providerId)
      ? providerId
      : (availableProviders[0] ?? 'openai');
  }

  private commitSettings(settings: Record<ProviderId, ProviderSettings>): void {
    this.settings = settings;
    persistProviderSettings(this.settings);
  }

  getDefaultProviderId(): ProviderId {
    return this.resolveAvailableProviderId(loadDefaultProviderId());
  }

  persistDefaultProviderId(providerId: ProviderId): void {
    persistDefaultProviderId(providerId);
  }

  getSettings(providerId: ProviderId): ProviderSettings {
    return this.settings[providerId] ?? getDefaultProviderSettings(providerId);
  }

  getAllSettings(): Record<ProviderId, ProviderSettings> {
    const snapshot = {} as Record<ProviderId, ProviderSettings>;
    for (const id of listProviderIds()) {
      snapshot[id] = { ...this.getSettings(id) };
    }
    return snapshot;
  }

  updateSettings(providerId: ProviderId, updates: Partial<ProviderSettings>): ProviderSettings {
    const current = this.getSettings(providerId);
    const next = normalizeProviderSettingsUpdate(providerId, current, updates);
    if (updates.tavily !== undefined) {
      this.commitSettings(
        applyGlobalTavilyConfig({ ...this.settings, [providerId]: next }, next.tavily)
      );
      return next;
    }

    this.commitSettings({ ...this.settings, [providerId]: next });
    return next;
  }

  replaceAllSettings(
    settings: Record<ProviderId, ProviderSettings>
  ): Record<ProviderId, ProviderSettings> {
    this.commitSettings(normalizeProviderSettingsRecord(settings));
    return this.getAllSettings();
  }

  reload(): Record<ProviderId, ProviderSettings> {
    this.settings = loadProviderSettings();
    return this.getAllSettings();
  }
}
