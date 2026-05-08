import { useMemo } from 'react';
import type { useChatSessions } from '@client/features/sessions/application/useChatSessions';
import type { Language, LanguagePreference } from '@/shared/utils/i18n';
import type { ThemePreference } from '@/shared/utils/theme';

type ChatSessionsState = ReturnType<typeof useChatSessions>;

type UseSidebarPropsOptions = {
  chatSessions: ChatSessionsState;
  language: Language;
  languagePreference: LanguagePreference;
  themePreference: ThemePreference;
  sidebarCollapsed: boolean;
  handleNewChatClick: () => void;
  handleLanguageChange: (value: LanguagePreference) => void;
  handleThemeChange: (value: ThemePreference) => void;
  handleOpenSettings: () => void;
  handleToggleSidebarCollapsed: () => void;
};

export const useSidebarProps = ({
  chatSessions,
  language,
  languagePreference,
  themePreference,
  sidebarCollapsed,
  handleNewChatClick,
  handleLanguageChange,
  handleThemeChange,
  handleOpenSettings,
  handleToggleSidebarCollapsed,
}: UseSidebarPropsOptions) => {
  const {
    currentSessionId,
    sessions,
    filteredSessions,
    searchQuery,
    editingSessionId,
    editTitleInput,
    sessionActionsDisabled,
    sessionActionsDisabledReason,
    sessionNotice,
    setSearchQuery,
    setEditTitleInput,
    handleLoadSession,
    handleStartEdit,
    handleDeleteSession,
    handleEditInputClick,
    handleEditKeyDown,
    handleSaveEdit,
    handleCancelEdit,
  } = chatSessions;

  return useMemo(
    () => ({
      currentSessionId,
      sessions,
      filteredSessions,
      searchQuery,
      editingSessionId,
      editTitleInput,
      sessionActionsDisabled,
      sessionActionsDisabledReason,
      sessionNotice,
      language,
      languagePreference,
      themePreference,
      collapsed: sidebarCollapsed,
      onNewChatClick: handleNewChatClick,
      onLanguagePreferenceChange: handleLanguageChange,
      onThemePreferenceChange: handleThemeChange,
      onSearchChange: setSearchQuery,
      onLoadSession: handleLoadSession,
      onStartEdit: handleStartEdit,
      onDeleteSession: handleDeleteSession,
      onEditTitleInputChange: setEditTitleInput,
      onEditInputClick: handleEditInputClick,
      onEditKeyDown: handleEditKeyDown,
      onSaveEdit: handleSaveEdit,
      onCancelEdit: handleCancelEdit,
      onOpenSettings: handleOpenSettings,
      onToggleCollapsed: handleToggleSidebarCollapsed,
    }),
    [
      currentSessionId,
      editTitleInput,
      editingSessionId,
      filteredSessions,
      handleCancelEdit,
      handleDeleteSession,
      handleEditInputClick,
      handleEditKeyDown,
      handleLanguageChange,
      handleLoadSession,
      handleNewChatClick,
      handleOpenSettings,
      handleSaveEdit,
      handleStartEdit,
      handleThemeChange,
      handleToggleSidebarCollapsed,
      language,
      languagePreference,
      searchQuery,
      setEditTitleInput,
      setSearchQuery,
      sidebarCollapsed,
      sessionActionsDisabled,
      sessionActionsDisabledReason,
      sessionNotice,
      sessions,
      themePreference,
    ]
  );
};
