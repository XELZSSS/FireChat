import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';
import type { ChatService } from '@client/features/chat/application/chatService';
import type {
  ProviderSettingsMap,
  SaveSettingsPayload,
} from '@client/features/settings/domain/settingsTypes';
import type { ProviderId } from '@/shared/types/chat';
import { setLanguagePreference, t } from '@/shared/utils/i18n';
import type { Language, LanguagePreference } from '@/shared/utils/i18n';
import {
  type AccentPreference,
  type Theme,
  type ThemePreference,
  setThemePreference,
} from '@/shared/utils/theme';
import type { AppFontSize, SendShortcut } from '@/shared/utils/appOptions';
import type { PetSettings } from '@client/features/pet/domain/petTypes';
import { updateAppSettings } from '@/infrastructure/persistence/appSettingsStore';
import {
  setDesktopTrayLabels,
  setDesktopTrayLanguage,
} from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import {
  createCustomProviderSnapshot,
  removeProviderSnapshotEntry,
  type CustomProviderDraft,
} from '@/infrastructure/providers/runtime/providerFileMutations';
import {
  getCurrentProviderFileSnapshot,
  persistProviderRuntimeState,
} from '@/infrastructure/providers/runtime/providerRuntimeSync';
import { saveSettingsTransaction } from '@client/features/settings/application/saveSettingsTransaction';

type UseAppSettingsOptions = {
  chatService: ChatService;
  providerSettings: ProviderSettingsMap;
  syncDefaultProviderState: () => void;
  syncConversationState: () => void;
  setLanguagePreferenceState: Dispatch<SetStateAction<LanguagePreference>>;
  setLanguageState: Dispatch<SetStateAction<Language>>;
  setThemePreferenceState: Dispatch<SetStateAction<ThemePreference>>;
  setThemeState: Dispatch<SetStateAction<Theme>>;
  setAccentPreferenceState: Dispatch<SetStateAction<AccentPreference>>;
  setSidebarCollapsedState: Dispatch<SetStateAction<boolean>>;
  setUiFontFamilyState: Dispatch<SetStateAction<string>>;
  setUiFontSizeState: Dispatch<SetStateAction<AppFontSize>>;
  setSendShortcutState: Dispatch<SetStateAction<SendShortcut>>;
  setShowMessageTimestampsState: Dispatch<SetStateAction<boolean>>;
  setWrapCodeBlocksState: Dispatch<SetStateAction<boolean>>;
  setPetSettingsState: Dispatch<SetStateAction<PetSettings>>;
  setReduceMotionState: Dispatch<SetStateAction<boolean>>;
  setCloseToTrayState: Dispatch<SetStateAction<boolean>>;
  setMinimizeToTrayState: Dispatch<SetStateAction<boolean>>;
  setLaunchAtStartupState: Dispatch<SetStateAction<boolean>>;
  setStartMinimizedToTrayState: Dispatch<SetStateAction<boolean>>;
  setRememberWindowBoundsState: Dispatch<SetStateAction<boolean>>;
  hasMessages: boolean;
};

export const useAppSettings = ({
  chatService,
  providerSettings,
  syncDefaultProviderState,
  syncConversationState,
  setLanguagePreferenceState,
  setLanguageState,
  setThemePreferenceState,
  setThemeState,
  setAccentPreferenceState,
  setSidebarCollapsedState,
  setUiFontFamilyState,
  setUiFontSizeState,
  setSendShortcutState,
  setShowMessageTimestampsState,
  setWrapCodeBlocksState,
  setPetSettingsState,
  setReduceMotionState,
  setCloseToTrayState,
  setMinimizeToTrayState,
  setLaunchAtStartupState,
  setStartMinimizedToTrayState,
  setRememberWindowBoundsState,
  hasMessages,
}: UseAppSettingsOptions) => {
  const syncTrayLabels = useCallback((language: Language) => {
    void setDesktopTrayLanguage(language);
    void setDesktopTrayLabels({
      open: t('tray.open'),
      hide: t('tray.hide'),
      toggleDevTools: t('tray.toggleDevTools'),
      quit: t('tray.quit'),
    });
  }, []);

  const handleSaveSettings = useCallback(
    async (value: SaveSettingsPayload) => {
      await saveSettingsTransaction({
        value,
        chatService,
        providerSettings,
        hasMessages,
        syncDefaultProviderState,
        syncConversationState,
        setLanguagePreferenceState,
        setLanguageState,
        setThemePreferenceState,
        setThemeState,
        setAccentPreferenceState,
        setSidebarCollapsedState,
        setUiFontFamilyState,
        setUiFontSizeState,
        setSendShortcutState,
        setShowMessageTimestampsState,
        setWrapCodeBlocksState,
        setPetSettingsState,
        setReduceMotionState,
        setCloseToTrayState,
        setMinimizeToTrayState,
        setLaunchAtStartupState,
        setStartMinimizedToTrayState,
        setRememberWindowBoundsState,
        syncTrayLabels,
      });
    },
    [
      chatService,
      hasMessages,
      providerSettings,
      setLanguagePreferenceState,
      setLanguageState,
      setThemePreferenceState,
      setThemeState,
      setAccentPreferenceState,
      setSidebarCollapsedState,
      setUiFontFamilyState,
      setUiFontSizeState,
      setSendShortcutState,
      setShowMessageTimestampsState,
      setWrapCodeBlocksState,
      setPetSettingsState,
      setReduceMotionState,
      setCloseToTrayState,
      setMinimizeToTrayState,
      setLaunchAtStartupState,
      setStartMinimizedToTrayState,
      setRememberWindowBoundsState,
      syncDefaultProviderState,
      syncConversationState,
      syncTrayLabels,
    ]
  );

  const handleSetSidebarCollapsed = useCallback(
    (collapsed: boolean) => {
      setSidebarCollapsedState(collapsed);
      updateAppSettings({ sidebarCollapsed: collapsed });
    },
    [setSidebarCollapsedState]
  );

  const handleLanguageChange = useCallback(
    (nextLanguagePreference: LanguagePreference) => {
      const resolvedLanguage = setLanguagePreference(nextLanguagePreference);
      setLanguagePreferenceState(nextLanguagePreference);
      setLanguageState(resolvedLanguage);
      syncTrayLabels(resolvedLanguage);
    },
    [setLanguagePreferenceState, setLanguageState, syncTrayLabels]
  );

  const handleThemeChange = useCallback(
    (nextThemePreference: ThemePreference) => {
      const resolvedTheme = setThemePreference(nextThemePreference);
      setThemePreferenceState(nextThemePreference);
      setThemeState(resolvedTheme);
    },
    [setThemePreferenceState, setThemeState]
  );

  const syncProviderCatalog = useCallback(() => {
    chatService.reloadProviderCatalog();
    syncDefaultProviderState();
    syncConversationState();
  }, [chatService, syncDefaultProviderState, syncConversationState]);

  const handleCreateCustomProvider = useCallback(
    async (draft: CustomProviderDraft) => {
      const nextSnapshot = createCustomProviderSnapshot(getCurrentProviderFileSnapshot(), draft);
      await persistProviderRuntimeState(nextSnapshot);
      syncProviderCatalog();
      return draft.id.trim().toLowerCase();
    },
    [syncProviderCatalog]
  );

  const handleDeleteProvider = useCallback(
    async (providerId: ProviderId) => {
      const nextSnapshot = removeProviderSnapshotEntry(
        getCurrentProviderFileSnapshot(),
        providerId
      );
      await persistProviderRuntimeState(nextSnapshot);
      syncProviderCatalog();
    },
    [syncProviderCatalog]
  );

  return {
    syncTrayLabels,
    handleSaveSettings,
    handleLanguageChange,
    handleThemeChange,
    handleSetSidebarCollapsed,
    handleCreateCustomProvider,
    handleDeleteProvider,
  };
};
