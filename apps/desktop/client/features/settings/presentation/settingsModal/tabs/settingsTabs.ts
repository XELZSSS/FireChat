import { t } from '@/shared/utils/i18n';
import type { ActiveSettingsTab } from '@client/features/settings/presentation/settingsModal/state/reducer';

type SettingsTabItem = {
  id: ActiveSettingsTab;
  label: string;
};

export const buildSettingsTabs = (): SettingsTabItem[] => {
  return [
    { id: 'provider', label: t('settings.modal.tab.providerRegular') },
    { id: 'customProvider', label: t('settings.modal.tab.providerCustom') },
    { id: 'requestLogs', label: t('settings.modal.tab.requestLogs') },
    { id: 'pet', label: t('settings.modal.tab.pet') },
    { id: 'options', label: t('settings.modal.tab.options') },
  ];
};

export const resolveVisibleSettingsTab = (
  activeTab: ActiveSettingsTab,
  tabs: Array<{ id: ActiveSettingsTab }>
): ActiveSettingsTab => (tabs.some((tab) => tab.id === activeTab) ? activeTab : 'provider');
