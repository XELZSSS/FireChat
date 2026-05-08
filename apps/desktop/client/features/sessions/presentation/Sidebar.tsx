import { memo, useCallback, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, SyntheticEvent } from 'react';
import { ChatSession } from '@/shared/types/chat';
import type { Language, LanguagePreference } from '@/shared/utils/i18n';
import { t } from '@/shared/utils/i18n';
import type { ThemePreference } from '@/shared/utils/theme';
import { ConfirmDialog } from '@/shared/ui';
import { SessionContextMenu } from '@client/features/sessions/presentation/sidebarParts';
import { SidebarFooter } from '@client/features/sessions/presentation/sidebarViews/SidebarFooter';
import { SidebarHeader } from '@client/features/sessions/presentation/sidebarViews/SidebarHeader';
import {
  SidebarCollapsedList,
  SidebarExpandedList,
} from '@client/features/sessions/presentation/sidebarViews/SidebarSessionLists';

type SidebarProps = {
  currentSessionId: string;
  sessions: ChatSession[];
  filteredSessions: ChatSession[];
  collapsed: boolean;
  searchQuery: string;
  editingSessionId: string | null;
  editTitleInput: string;
  sessionActionsDisabled: boolean;
  sessionActionsDisabledReason: string | null;
  sessionNotice: string | null;
  language: Language;
  languagePreference: LanguagePreference;
  themePreference: ThemePreference;
  onNewChatClick: () => void;
  onLanguagePreferenceChange: (value: LanguagePreference) => void;
  onThemePreferenceChange: (value: ThemePreference) => void;
  onSearchChange: (value: string) => void;
  onLoadSession: (session: ChatSession) => void;
  onStartEdit: (e: MouseEvent, session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onEditTitleInputChange: (value: string) => void;
  onEditInputClick: (e: MouseEvent) => void;
  onEditKeyDown: (e: KeyboardEvent) => void;
  onSaveEdit: (e: SyntheticEvent | MouseEvent) => void;
  onCancelEdit: (e: MouseEvent) => void;
  onOpenSettings: () => void;
};

type SessionMenuState = {
  session: ChatSession;
  x: number;
  y: number;
};

const SESSION_MENU_OFFSET = 6;

const SidebarComponent = ({
  currentSessionId,
  sessions,
  filteredSessions,
  collapsed,
  searchQuery,
  editingSessionId,
  editTitleInput,
  sessionActionsDisabled,
  sessionActionsDisabledReason,
  sessionNotice,
  language,
  languagePreference,
  themePreference,
  onNewChatClick,
  onLanguagePreferenceChange,
  onThemePreferenceChange,
  onSearchChange,
  onLoadSession,
  onStartEdit,
  onDeleteSession,
  onEditTitleInputChange,
  onEditInputClick,
  onEditKeyDown,
  onSaveEdit,
  onCancelEdit,
  onOpenSettings,
}: SidebarProps) => {
  const listContainerRef = useRef<HTMLDivElement>(null);
  const expandedContentId = useId();
  const [pendingDeleteSession, setPendingDeleteSession] = useState<ChatSession | null>(null);
  const [sessionMenuState, setSessionMenuState] = useState<SessionMenuState | null>(null);
  const deleteDescription = useMemo(
    () =>
      pendingDeleteSession
        ? t('sidebar.deleteConfirm.description').replace('{title}', pendingDeleteSession.title)
        : '',
    [pendingDeleteSession]
  );

  const handleCloseSessionMenu = useCallback(() => {
    setSessionMenuState(null);
  }, []);

  const handleCancelDeleteSession = useCallback(() => {
    setPendingDeleteSession(null);
  }, []);

  const handleSessionItemKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, session: ChatSession, disabled: boolean) => {
      if (disabled) return;

      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        setSessionMenuState({ session, x: rect.right, y: rect.bottom + SESSION_MENU_OFFSET });
        return;
      }

      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      handleCloseSessionMenu();
      onLoadSession(session);
    },
    [handleCloseSessionMenu, onLoadSession]
  );

  const handleRequestDeleteSession = useCallback(
    (event: MouseEvent, session: ChatSession) => {
      event.stopPropagation();
      if (sessionActionsDisabled) {
        return;
      }
      handleCloseSessionMenu();
      setPendingDeleteSession(session);
    },
    [handleCloseSessionMenu, sessionActionsDisabled]
  );

  const handleOpenSessionMenu = useCallback(
    (event: MouseEvent<HTMLElement>, session: ChatSession, disabled: boolean) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) {
        return;
      }

      const triggerRect = event.currentTarget.getBoundingClientRect();
      const x = event.type === 'contextmenu' ? event.clientX : triggerRect.right;
      const y =
        event.type === 'contextmenu' ? event.clientY : triggerRect.bottom + SESSION_MENU_OFFSET;

      setSessionMenuState({ session, x, y });
    },
    []
  );

  const handleSelectSession = useCallback(
    (session: ChatSession, disabled: boolean) => {
      if (!disabled) {
        onLoadSession(session);
      }

      handleCloseSessionMenu();
    },
    [handleCloseSessionMenu, onLoadSession]
  );
  const handleLoadSessionFromList = useCallback(
    (session: ChatSession) => {
      handleSelectSession(session, false);
    },
    [handleSelectSession]
  );

  const handleConfirmDeleteSession = useCallback(() => {
    if (!pendingDeleteSession || sessionActionsDisabled) {
      return;
    }

    onDeleteSession(pendingDeleteSession.id);
    handleCancelDeleteSession();
  }, [handleCancelDeleteSession, onDeleteSession, pendingDeleteSession, sessionActionsDisabled]);

  return (
    <aside
      className="sidebar relative z-30 flex h-full overflow-hidden border-r border-[var(--line-1)] bg-[var(--bg-1)]"
      data-collapsed={collapsed ? 'true' : 'false'}
      data-language={language}
    >
      <div className="sidebar-rail flex h-full w-16 shrink-0 flex-col items-center border-r border-[var(--line-1)] bg-[var(--bg-1)] px-2 py-3">
        <SidebarHeader
          collapsed
          sessionActionsDisabled={sessionActionsDisabled}
          sessionActionsDisabledReason={sessionActionsDisabledReason}
          onNewChatClick={onNewChatClick}
        />

        {collapsed ? (
          <SidebarCollapsedList
            currentSessionId={currentSessionId}
            sessions={sessions}
            sessionActionsDisabled={sessionActionsDisabled}
            sessionActionsDisabledReason={sessionActionsDisabledReason}
            listContainerRef={listContainerRef}
            onLoadSession={handleLoadSessionFromList}
            onOpenMenu={handleOpenSessionMenu}
            onSessionItemKeyDown={handleSessionItemKeyDown}
          />
        ) : (
          <div className="min-h-0 flex-1" aria-hidden="true" />
        )}

        <SidebarFooter
          collapsed
          languagePreference={languagePreference}
          themePreference={themePreference}
          onLanguagePreferenceChange={onLanguagePreferenceChange}
          onThemePreferenceChange={onThemePreferenceChange}
          onOpenSettings={onOpenSettings}
        />
      </div>

      {collapsed ? null : (
        <div className="sidebar-panel flex h-full min-w-0 flex-1 flex-col bg-[var(--bg-1)] px-3 py-4">
          <SidebarExpandedList
            currentSessionId={currentSessionId}
            filteredSessions={filteredSessions}
            sessions={sessions}
            searchQuery={searchQuery}
            editingSessionId={editingSessionId}
            editTitleInput={editTitleInput}
            sessionActionsDisabled={sessionActionsDisabled}
            sessionActionsDisabledReason={sessionActionsDisabledReason}
            sessionNotice={sessionNotice}
            expandedContentId={expandedContentId}
            listContainerRef={listContainerRef}
            onSearchChange={onSearchChange}
            onLoadSession={handleLoadSessionFromList}
            onOpenMenu={handleOpenSessionMenu}
            onSessionItemKeyDown={handleSessionItemKeyDown}
            onEditTitleInputChange={onEditTitleInputChange}
            onEditInputClick={onEditInputClick}
            onEditKeyDown={onEditKeyDown}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDeleteSession}
        title={t('sidebar.deleteConfirm.title')}
        description={deleteDescription}
        confirmLabel={t('sidebar.deleteConfirm.confirm')}
        cancelLabel={t('settings.modal.cancel')}
        onConfirm={handleConfirmDeleteSession}
        onCancel={handleCancelDeleteSession}
        danger
      />

      <SessionContextMenu
        open={!!sessionMenuState}
        session={sessionMenuState?.session ?? null}
        x={sessionMenuState?.x ?? 0}
        y={sessionMenuState?.y ?? 0}
        disabled={sessionActionsDisabled}
        disabledReason={sessionActionsDisabledReason}
        onClose={handleCloseSessionMenu}
        onStartEdit={onStartEdit}
        onRequestDeleteSession={handleRequestDeleteSession}
      />
    </aside>
  );
};

const Sidebar = memo(SidebarComponent);
export default Sidebar;
