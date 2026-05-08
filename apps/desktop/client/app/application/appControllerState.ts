import { useCallback, useState } from 'react';
import type { UpdaterStatus } from '@contracts/updater';
import { chatService } from '@client/features/chat/application/chatService';
import {
  getLanguagePreference,
  type Language,
  type LanguagePreference,
  setLanguagePreference,
} from '@/shared/utils/i18n';
import {
  type AccentPreference,
  type Theme,
  type ThemePreference,
  getAccentPreference,
  getTheme,
  getThemePreference,
} from '@/shared/utils/theme';
import { loadAppSettings } from '@/infrastructure/persistence/appSettingsStore';
import { readAppStorage } from '@/infrastructure/persistence/storageKeys';
import { DEFAULT_UPDATER_STATUS } from '@client/features/desktop-shell/infrastructure/updater/updaterClient';
import type { AppFontSize, SendShortcut } from '@/shared/utils/appOptions';
import type { PetSettings } from '@client/features/pet/domain/petTypes';

const readStoredUpdaterStatus = (): UpdaterStatus => {
  const cached = readAppStorage('updaterStatus');
  if (!cached) return DEFAULT_UPDATER_STATUS;

  try {
    const parsed = JSON.parse(cached) as Partial<UpdaterStatus>;
    return parsed.status ? { ...DEFAULT_UPDATER_STATUS, ...parsed } : DEFAULT_UPDATER_STATUS;
  } catch {
    return DEFAULT_UPDATER_STATUS;
  }
};

const getDefaultProviderState = () => ({
  providerSettings: chatService.getAllProviderSettings(),
  currentProviderId: chatService.getDefaultProviderId(),
});

const getConversationState = () => {
  const context = chatService.getConversationContext();
  return {
    currentProviderId: context.providerId,
    currentModelName: context.modelName,
  };
};

export const useProviderState = () => {
  const [defaultProviderState, setDefaultProviderState] = useState(getDefaultProviderState);
  const [conversationState, setConversationState] = useState(getConversationState);

  const syncDefaultProviderState = useCallback(() => {
    setDefaultProviderState(getDefaultProviderState());
  }, []);

  const syncConversationState = useCallback(() => {
    setConversationState(getConversationState());
  }, []);

  return {
    defaultProviderState,
    conversationState,
    syncDefaultProviderState,
    syncConversationState,
  };
};

export const useAppPreferenceState = () => {
  const initialAppSettings = loadAppSettings();
  const initialLanguagePreference =
    initialAppSettings.languagePreference ?? getLanguagePreference();

  const [language, setLanguageState] = useState<Language>(() => {
    return setLanguagePreference(initialLanguagePreference, { persist: false });
  });
  const [languagePreference, setLanguagePreferenceState] = useState<LanguagePreference>(
    () => initialLanguagePreference
  );
  const [theme, setThemeState] = useState<Theme>(() => getTheme());
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() =>
    getThemePreference()
  );
  const [accentPreference, setAccentPreferenceState] = useState<AccentPreference>(() =>
    getAccentPreference()
  );
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(
    () => initialAppSettings.sidebarCollapsed
  );
  const [uiFontFamily, setUiFontFamilyState] = useState<string>(
    () => initialAppSettings.uiFontFamily
  );
  const [uiFontSize, setUiFontSizeState] = useState<AppFontSize>(
    () => initialAppSettings.uiFontSize
  );
  const [sendShortcut, setSendShortcutState] = useState<SendShortcut>(
    () => initialAppSettings.sendShortcut
  );
  const [showMessageTimestamps, setShowMessageTimestampsState] = useState<boolean>(
    () => initialAppSettings.showMessageTimestamps
  );
  const [wrapCodeBlocks, setWrapCodeBlocksState] = useState<boolean>(
    () => initialAppSettings.wrapCodeBlocks
  );
  const [petSettings, setPetSettingsState] = useState<PetSettings>(
    () => initialAppSettings.petSettings
  );
  const [reduceMotion, setReduceMotionState] = useState<boolean>(
    () => initialAppSettings.reduceMotion
  );
  const [closeToTray, setCloseToTrayState] = useState<boolean>(
    () => initialAppSettings.closeToTray
  );
  const [minimizeToTray, setMinimizeToTrayState] = useState<boolean>(
    () => initialAppSettings.minimizeToTray
  );
  const [launchAtStartup, setLaunchAtStartupState] = useState<boolean>(
    () => initialAppSettings.launchAtStartup
  );
  const [startMinimizedToTray, setStartMinimizedToTrayState] = useState<boolean>(
    () => initialAppSettings.startMinimizedToTray
  );
  const [rememberWindowBounds, setRememberWindowBoundsState] = useState<boolean>(
    () => initialAppSettings.rememberWindowBounds
  );
  const [appVersion, setAppVersion] = useState<string>(() => readAppStorage('appVersion') ?? '');
  const [updaterStatus, setUpdaterStatus] = useState<UpdaterStatus>(readStoredUpdaterStatus);

  return {
    language,
    setLanguageState,
    languagePreference,
    setLanguagePreferenceState,
    theme,
    setThemeState,
    themePreference,
    setThemePreferenceState,
    accentPreference,
    setAccentPreferenceState,
    sidebarCollapsed,
    setSidebarCollapsedState,
    uiFontFamily,
    setUiFontFamilyState,
    uiFontSize,
    setUiFontSizeState,
    sendShortcut,
    setSendShortcutState,
    showMessageTimestamps,
    setShowMessageTimestampsState,
    wrapCodeBlocks,
    setWrapCodeBlocksState,
    petSettings,
    setPetSettingsState,
    reduceMotion,
    setReduceMotionState,
    closeToTray,
    setCloseToTrayState,
    minimizeToTray,
    setMinimizeToTrayState,
    launchAtStartup,
    setLaunchAtStartupState,
    startMinimizedToTray,
    setStartMinimizedToTrayState,
    rememberWindowBounds,
    setRememberWindowBoundsState,
    appVersion,
    setAppVersion,
    updaterStatus,
    setUpdaterStatus,
  };
};
