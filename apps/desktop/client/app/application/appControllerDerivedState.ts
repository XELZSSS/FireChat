import { t } from '@/shared/utils/i18n';
import type { ProviderSettingsMap } from '@client/features/settings/domain/settingsTypes';

export const getSearchAvailability = (): boolean => {
  return false;
};

export const getSettingsInteractionLockReason = (isChatBusy: boolean): string | null =>
  isChatBusy ? t('settings.modal.busy') : null;
