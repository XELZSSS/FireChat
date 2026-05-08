import { ProviderId } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import { getDefaultOpenAdapterBaseUrl } from '@/infrastructure/providers/config/baseUrl';
import { getProviderDefaults } from '@/infrastructure/providers/config/providerConfig';
import { openadapterFetch } from '@/infrastructure/network/openadapterRuntimeFetch';
import { AISdkOpenAICompatibleProviderBase } from '@/infrastructure/providers/aiSdkProviderBase';
import { extractReasoningDetailsFromOpenAIRawChunk } from '@/infrastructure/providers/aiSdkProviderMessages';
import {
  createDefaultOpenAdapterToolSettings,
  normalizeOpenAdapterToolSettings,
  type OpenAdapterToolSettings,
} from '@/infrastructure/providers/openadapterToolConfig';
import { buildOpenAdapterToolSet } from '@/infrastructure/providers/openadapterTools';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import type { ProviderChat } from '@/infrastructure/providers/types';

export const OPENADAPTER_PROVIDER_ID: ProviderId = 'openadapter';

class OpenAdapterProvider extends AISdkOpenAICompatibleProviderBase implements ProviderChat {
  private toolSettings: OpenAdapterToolSettings = createDefaultOpenAdapterToolSettings();

  constructor() {
    const { defaultModel, defaultApiKey } = getProviderDefaults(OPENADAPTER_PROVIDER_ID);

    super({
      id: OPENADAPTER_PROVIDER_ID,
      defaultModel,
      defaultApiKey,
      defaultBaseUrl: getDefaultOpenAdapterBaseUrl(),
      missingApiKeyError: t('settings.provider.error.openadapter.missingApiKey'),
      supportsTavily: false,
      supportsBaseUrl: true,
      supportsCustomHeaders: false,
      logLabel: 'OpenAdapter',
      providerName: OPENADAPTER_PROVIDER_ID,
    });
  }

  protected override resolveBaseUrl(baseUrl?: string): string | undefined {
    return (baseUrl ?? getDefaultOpenAdapterBaseUrl()).trim() || getDefaultOpenAdapterBaseUrl();
  }

  protected override buildFetch(): typeof fetch {
    return openadapterFetch;
  }

  protected override getRawReasoningTexts(raw: unknown): string[] {
    return extractReasoningDetailsFromOpenAIRawChunk(raw);
  }

  protected override async buildAdditionalTools({
    searchEnabled,
  }: {
    apiKey?: string;
    searchEnabled: boolean;
    requestPolicy?: RequestPolicy;
  }): Promise<Record<string, unknown> | undefined> {
    return buildOpenAdapterToolSet({
      apiKey: this.getApiKey(),
      searchEnabled,
      toolSettings: this.toolSettings,
    });
  }

  getOpenAdapterToolSettings(): OpenAdapterToolSettings {
    return this.toolSettings;
  }

  setOpenAdapterToolSettings(settings: OpenAdapterToolSettings): void {
    this.toolSettings = normalizeOpenAdapterToolSettings(settings);
  }
}

export const createProviderInstance = (): ProviderChat => new OpenAdapterProvider();
