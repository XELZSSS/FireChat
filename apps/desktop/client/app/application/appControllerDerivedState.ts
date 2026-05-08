import { t } from '@/shared/utils/i18n';
import { hasSearchConfig } from '@/infrastructure/providers/tavily';
import { hasEnabledOpenAdapterTools } from '@/infrastructure/providers/openadapterToolConfig';
import type { ProviderSettingsMap } from '@client/features/settings/domain/settingsTypes';

export const getSearchAvailability = ({
  providerSettings,
  providerId,
}: {
  providerSettings: ProviderSettingsMap;
  providerId: keyof ProviderSettingsMap;
}): boolean => {
  const currentProviderSettings = providerSettings[providerId];

  return providerId === 'openadapter'
    ? Boolean(currentProviderSettings?.apiKey) &&
        hasEnabledOpenAdapterTools(currentProviderSettings?.openAdapterTools)
    : hasSearchConfig(currentProviderSettings?.tavily);
};

export const getSettingsInteractionLockReason = (isChatBusy: boolean): string | null =>
  isChatBusy ? t('settings.modal.busy') : null;
