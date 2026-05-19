import { t } from '@/shared/utils/i18n';

export const getSettingsInteractionLockReason = (isChatBusy: boolean): string | null =>
  isChatBusy ? t('settings.modal.busy') : null;
