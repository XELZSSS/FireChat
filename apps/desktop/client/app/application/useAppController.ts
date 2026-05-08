import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/shared/types/chat';
import { chatService } from '@client/features/chat/application/chatService';
import { t } from '@/shared/utils/i18n';
import { useChatSessions } from '@client/features/sessions/application/useChatSessions';
import { useStreamingMessages } from '@client/features/chat/application/streaming/useStreamingMessages';
import { useSearchToggle } from '@client/features/chat/application/search/useSearchToggle';
import { useReasoningControl } from '@client/features/chat/application/reasoning/useReasoningControl';
import { useAppSettings } from '@client/features/settings/application/useAppSettings';
import {
  useAppMetadataSync,
  useCliProviderConfigSync,
  useDocumentAppOptions,
  useDocumentAppearance,
  useLocalProxyConfigSync,
  useTrayLanguageSync,
  useWindowBehaviorSync,
} from '@client/app/application/appControllerEffects';
import {
  useChatMainProps,
  useSettingsModalProps,
  useSidebarProps,
} from '@client/app/application/appControllerViewModels';
import {
  useAppPreferenceState,
  useProviderState,
} from '@client/app/application/appControllerState';
import { useAppControllerSettingsState } from '@client/app/application/appControllerSettingsState';
import { useAppControllerHandlers } from '@client/app/application/appControllerHandlers';
import {
  getSearchAvailability,
  getSettingsInteractionLockReason,
} from '@client/app/application/appControllerDerivedState';
import { supportsProviderImageGeneration } from '@/infrastructure/providers/providerImageCatalog';

export const useAppController = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(false);
  const {
    defaultProviderState,
    conversationState,
    syncDefaultProviderState,
    syncConversationState,
  } = useProviderState();
  const {
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
  } = useAppPreferenceState();

  const { providerSettings } = defaultProviderState;
  const { currentProviderId: conversationProviderId, currentModelName: conversationModelName } =
    conversationState;
  const defaultSessionTitle = t('sidebar.newChat');
  const hasMessages = messages.length > 0;
  const searchAvailable = getSearchAvailability({
    providerSettings,
    providerId: conversationProviderId,
  });
  const imageGenerationAvailable = supportsProviderImageGeneration(conversationProviderId);
  const effectiveImageGenerationEnabled = imageGenerationAvailable && imageGenerationEnabled;

  useDocumentAppearance(language, themePreference, theme, accentPreference);
  useDocumentAppOptions({ uiFontFamily, uiFontSize, reduceMotion });
  useAppMetadataSync({ setAppVersion, setUpdaterStatus });
  useLocalProxyConfigSync();
  useCliProviderConfigSync();
  useWindowBehaviorSync({
    closeToTray,
    minimizeToTray,
    launchAtStartup,
    startMinimizedToTray,
    rememberWindowBounds,
  });

  const commitCurrentSessionNowRef = useRef<(() => void) | null>(null);
  const commitCurrentSessionNow = useCallback(() => {
    commitCurrentSessionNowRef.current?.();
  }, []);

  const streaming = useStreamingMessages({
    chatService,
    messages,
    setMessages,
    commitCurrentSessionNow,
  });

  const chatSessions = useChatSessions({
    chatService,
    messages,
    setMessages,
    defaultSessionTitle,
    syncConversationState,
    isStreaming: streaming.isStreaming,
    isLoading: streaming.isLoading,
  });

  const { startNewChat, commitCurrentSession, currentSessionId } = chatSessions;

  useEffect(() => {
    commitCurrentSessionNowRef.current = () => commitCurrentSession({ force: true });
  }, [commitCurrentSession]);

  const { searchEnabled, setSearchEnabled } = useSearchToggle({
    chatService,
    searchAvailable,
    currentProviderId: conversationProviderId,
  });
  const {
    reasoningControlVisible,
    reasoningEnabled,
    reasoningLevel,
    reasoningLevelOptions,
    reasoningLevelSupported,
    reasoningToggleLocked,
    setReasoningEnabled,
    setReasoningLevel,
  } = useReasoningControl({
    chatService,
    currentProviderId: conversationProviderId,
    currentModelName: conversationModelName,
  });
  const { isSettingsOpen, handleCloseSettings, handleOpenSettings } =
    useAppControllerSettingsState();

  const isChatBusy = streaming.isStreaming || streaming.isLoading;
  const settingsInteractionLockReason = getSettingsInteractionLockReason(isChatBusy);

  const {
    syncTrayLabels,
    handleSaveSettings,
    handleLanguageChange,
    handleThemeChange,
    handleSetSidebarCollapsed,
    handleCreateCustomProvider,
    handleDeleteProvider,
  } = useAppSettings({
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
  });
  const {
    handleNewChatClick,
    handleReasoningLevelChange,
    handleToggleImageGeneration,
    handleToggleReasoning,
    handleToggleSearch,
    handleToggleSidebarCollapsed,
  } = useAppControllerHandlers({
    isStreaming: streaming.isStreaming,
    isLoading: streaming.isLoading,
    startNewChat,
    setSearchEnabled,
    setImageGenerationEnabled,
    imageGenerationAvailable,
    setReasoningEnabled,
    setReasoningLevel,
    sidebarCollapsed,
    handleSetSidebarCollapsed,
  });

  useTrayLanguageSync(language, syncTrayLabels);

  const settingsModalProps = useSettingsModalProps({
    isSettingsOpen,
    providerSettings,
    currentProviderId: conversationProviderId,
    language,
    languagePreference,
    theme,
    themePreference,
    accentPreference,
    settingsInteractionLockReason,
    handleCloseSettings,
    handleSaveSettings,
    handleCreateCustomProvider,
    handleDeleteProvider,
    appVersion,
    updaterStatus,
  });

  const sidebarProps = useSidebarProps({
    chatSessions,
    language,
    languagePreference,
    themePreference,
    sidebarCollapsed,
    handleNewChatClick,
    handleOpenSettings,
    handleLanguageChange,
    handleThemeChange,
    handleToggleSidebarCollapsed,
  });

  const chatMainProps = useChatMainProps({
    messages,
    currentSessionId,
    isSessionStateReady: chatSessions.isSessionStateReady,
    streaming,
    language,
    reasoningEnabled,
    reasoningControlVisible,
    reasoningLevel,
    reasoningLevelOptions,
    reasoningLevelSupported,
    reasoningToggleLocked,
    sendShortcut,
    showMessageTimestamps,
    wrapCodeBlocks,
    petSettings,
    searchEnabled,
    imageGenerationEnabled: effectiveImageGenerationEnabled,
    imageGenerationAvailable,
    searchAvailable,
    handleReasoningLevelChange,
    handleToggleImageGeneration,
    handleToggleReasoning,
    handleToggleSearch,
  });

  return {
    language,
    settingsModalProps,
    sidebarProps,
    chatMainProps,
  };
};
