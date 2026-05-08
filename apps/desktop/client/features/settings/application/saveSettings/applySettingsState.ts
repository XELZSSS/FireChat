import type { ChatService } from '@client/features/chat/application/chatService';
import type { AppSettings } from '@/infrastructure/persistence/appSettingsStore';
import type { ProviderId } from '@/shared/types/chat';
import { setLanguagePreference } from '@/shared/utils/i18n';
import { setAccentPreference, setThemePreference } from '@/shared/utils/theme';
import type { AppPreferenceStateSetters } from '@client/features/settings/application/saveSettings/types';

export const applyAppSettingsState = (
  appSettings: AppSettings,
  {
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
  }: AppPreferenceStateSetters
): void => {
  const resolvedLanguage = setLanguagePreference(appSettings.languagePreference, {
    persist: false,
  });
  const resolvedTheme = setThemePreference(appSettings.themePreference, { persist: false });
  const resolvedAccent = setAccentPreference(appSettings.accentPreference, { persist: false });

  setLanguagePreferenceState(appSettings.languagePreference);
  setLanguageState(resolvedLanguage);
  setThemePreferenceState(appSettings.themePreference);
  setThemeState(resolvedTheme);
  setAccentPreferenceState(resolvedAccent);
  setSidebarCollapsedState(appSettings.sidebarCollapsed);
  setUiFontFamilyState(appSettings.uiFontFamily);
  setUiFontSizeState(appSettings.uiFontSize);
  setSendShortcutState(appSettings.sendShortcut);
  setShowMessageTimestampsState(appSettings.showMessageTimestamps);
  setWrapCodeBlocksState(appSettings.wrapCodeBlocks);
  setPetSettingsState(appSettings.petSettings);
  setReduceMotionState(appSettings.reduceMotion);
  setCloseToTrayState(appSettings.closeToTray);
  setMinimizeToTrayState(appSettings.minimizeToTray);
  setLaunchAtStartupState(appSettings.launchAtStartup);
  setStartMinimizedToTrayState(appSettings.startMinimizedToTray);
  setRememberWindowBoundsState(appSettings.rememberWindowBounds);
  syncTrayLabels(resolvedLanguage);
};

export const syncChatStateAfterSettingsMutation = ({
  chatService,
  hasMessages,
  nextDefaultProviderId,
  syncDefaultProviderState,
  syncConversationState,
}: {
  chatService: ChatService;
  hasMessages: boolean;
  nextDefaultProviderId: ProviderId;
  syncDefaultProviderState: () => void;
  syncConversationState: () => void;
}): void => {
  if (!hasMessages && chatService.getProviderId() !== nextDefaultProviderId) {
    chatService.resetChat();
    chatService.activateConversationContext({
      providerId: nextDefaultProviderId,
      modelName: chatService.getProviderSettings(nextDefaultProviderId).modelName,
    });
  }

  syncDefaultProviderState();
  syncConversationState();
};
