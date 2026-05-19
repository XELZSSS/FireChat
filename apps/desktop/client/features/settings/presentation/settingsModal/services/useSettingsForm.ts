import { useEffect, useMemo, useReducer } from 'react';
import { ProviderId } from '@/shared/types/chat';
import type { Language } from '@/shared/utils/i18n';
import { settingsModalReducer } from '@client/features/settings/presentation/settingsModal/state/reducer';
import type { ProviderSettingsMap } from '@client/features/settings/domain/settingsTypes';
import { loadAppSettings } from '@/infrastructure/persistence/appSettingsStore';
import { loadProviderSettings } from '@/infrastructure/persistence/providerSettingsStore';
import {
  buildProviderSelectionState,
  buildSettingsModalState,
  type BuildStateInput,
} from '@client/features/settings/presentation/settingsModal/state/stateMappers';
import { getProviderUiMetaForId } from '@/infrastructure/providers/config/providerConfig';
import {
  buildProviderOptions,
  preloadProviderIcons,
  resolveSelectableProviderId,
} from '@client/features/settings/presentation/settingsModal/sections/providerCatalog';
import {
  buildSettingsTabs,
  resolveVisibleSettingsTab,
} from '@client/features/settings/presentation/settingsModal/tabs/settingsTabs';

type UseSettingsFormOptions = BuildStateInput & {
  language: Language;
  providerSettings: ProviderSettingsMap;
};

let lastViewedProviderId: ProviderId | null = null;

export const useSettingsForm = ({
  providerSettings,
  providerId,
  languagePreference,
  themePreference,
  accentPreference,
  language,
}: UseSettingsFormOptions) => {
  const appSettingsSeed = useMemo(() => loadAppSettings(), []);
  const providerOptionsKey = Object.keys(providerSettings).join('\u0000');
  const providerOptions = useMemo(() => {
    void providerOptionsKey;
    return buildProviderOptions();
  }, [providerOptionsKey]);
  const resolvedInitialProviderId = resolveSelectableProviderId(lastViewedProviderId, providerId);

  const stateSeed = useMemo(
    () =>
      buildSettingsModalState(
        {
          providerId: resolvedInitialProviderId,
          providerSettings: providerSettings[resolvedInitialProviderId],
          activeTabProviderId: providerId,
          languagePreference,
          themePreference,
          accentPreference,
        },
        appSettingsSeed
      ),
    [
      accentPreference,
      appSettingsSeed,
      languagePreference,
      providerId,
      providerSettings,
      resolvedInitialProviderId,
      themePreference,
    ]
  );

  const [state, dispatch] = useReducer(settingsModalReducer, stateSeed);

  useEffect(() => {
    preloadProviderIcons();
  }, []);

  const activeMeta = getProviderUiMetaForId(state.provider.providerId);
  const tabs = useMemo(() => {
    void language;
    return buildSettingsTabs();
  }, [language]);

  useEffect(() => {
    const nextActiveTab = resolveVisibleSettingsTab(state.ui.activeTab, tabs);
    if (nextActiveTab === state.ui.activeTab) return;
    dispatch({ type: 'patch_ui', payload: { activeTab: nextActiveTab } });
  }, [state.ui.activeTab, tabs]);

  const handleProviderChange = (nextProviderId: ProviderId) => {
    const resolvedProviderId = resolveSelectableProviderId(nextProviderId, providerId);
    lastViewedProviderId = resolvedProviderId;
    const latestProviderSettings = loadProviderSettings();
    const nextProviderSettings =
      providerSettings[resolvedProviderId] ?? latestProviderSettings[resolvedProviderId];
    const nextProviderState = buildProviderSelectionState(resolvedProviderId, nextProviderSettings);

    dispatch({
      type: 'patch_provider',
      payload: nextProviderState.provider,
    });
    dispatch({
      type: 'patch_ui',
      payload: nextProviderState.ui,
    });
  };

  return {
    state,
    stateSeed,
    dispatch,
    providerOptions,
    activeMeta,
    tabs,
    handleProviderChange,
  };
};

