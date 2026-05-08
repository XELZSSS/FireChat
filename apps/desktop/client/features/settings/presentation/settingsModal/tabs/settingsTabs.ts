import { t } from '@/shared/utils/i18n';
import type { ActiveSettingsTab } from '@client/features/settings/presentation/settingsModal/state/reducer';

type SettingsTabItem = {
  id: ActiveSettingsTab;
  label: string;
};

export const buildSettingsTabs = ({
  supportsSearch,
}: {
  supportsSearch: boolean;
}): SettingsTabItem[] => {
  const tabs: SettingsTabItem[] = [
    { id: 'provider', label: t('settings.modal.tab.providerRegular') },
    { id: 'customProvider', label: t('settings.modal.tab.providerCustom') },
    { id: 'mcp', label: t('settings.modal.tab.mcp') },
    { id: 'imageGeneration', label: t('settings.modal.tab.imageGeneration') },
    { id: 'search', label: t('settings.modal.tab.search') },
    { id: 'requestLogs', label: t('settings.modal.tab.requestLogs') },
    { id: 'pet', label: t('settings.modal.tab.pet') },
    { id: 'options', label: t('settings.modal.tab.options') },
  ];

  return tabs.filter((tab) => supportsSearch || tab.id !== 'search');
};

export const resolveVisibleSettingsTab = (
  activeTab: ActiveSettingsTab,
  tabs: Array<{ id: ActiveSettingsTab }>
): ActiveSettingsTab => (tabs.some((tab) => tab.id === activeTab) ? activeTab : 'provider');

