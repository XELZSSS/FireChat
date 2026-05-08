import { Input } from '@/shared/ui';
import { SearchIcon } from '@/shared/ui/icons';
import { t } from '@/shared/utils/i18n';
import {
  CollapsedSessionItem,
  ExpandedSessionItem,
} from '@client/features/sessions/presentation/sidebarViews/SidebarSessionItems';
import { SIDEBAR_NOTICE_CLASS } from '@client/features/sessions/presentation/sidebarHelpers';
import type {
  SidebarCollapsedListProps,
  SidebarExpandedListProps,
} from '@client/features/sessions/presentation/sidebarViews/types';

export function SidebarCollapsedList({
  currentSessionId,
  sessions,
  sessionActionsDisabled,
  sessionActionsDisabledReason,
  listContainerRef,
  onLoadSession,
  onOpenMenu,
  onSessionItemKeyDown,
}: SidebarCollapsedListProps) {
  return (
    <div ref={listContainerRef} className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col items-center gap-1.5 px-1 py-1">
        {sessions.map((session) => (
          <CollapsedSessionItem
            key={session.id}
            currentSessionId={currentSessionId}
            session={session}
            sessionActionsDisabled={sessionActionsDisabled}
            sessionActionsDisabledReason={sessionActionsDisabledReason}
            onLoadSession={onLoadSession}
            onOpenMenu={onOpenMenu}
            onSessionItemKeyDown={onSessionItemKeyDown}
          />
        ))}
      </div>
    </div>
  );
}

export function SidebarExpandedList({
  currentSessionId,
  filteredSessions,
  sessions,
  searchQuery,
  editingSessionId,
  editTitleInput,
  sessionActionsDisabled,
  sessionActionsDisabledReason,
  sessionNotice,
  expandedContentId,
  listContainerRef,
  onSearchChange,
  onLoadSession,
  onOpenMenu,
  onSessionItemKeyDown,
  onEditTitleInputChange,
  onEditInputClick,
  onEditKeyDown,
  onSaveEdit,
  onCancelEdit,
}: SidebarExpandedListProps) {
  const visibleNotice = sessionNotice ?? sessionActionsDisabledReason;
  const hasNoSessions = sessions.length === 0;
  const hasNoMatchingSessions = !hasNoSessions && filteredSessions.length === 0;

  return (
    <div id={expandedContentId} className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3">
        <div className="group relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)] group-focus-within:text-[var(--accent)]"
            size={14}
            strokeWidth={2}
          />
          <Input
            type="text"
            placeholder={t('sidebar.searchPlaceholder')}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-9 w-full py-0 pl-9 pr-3 text-sm focus:border-[var(--line-1)] focus:bg-[var(--bg-1)] focus:shadow-none"
          />
        </div>
      </div>

      {visibleNotice ? <div className={SIDEBAR_NOTICE_CLASS}>{visibleNotice}</div> : null}

      <div ref={listContainerRef} className="flex-1 overflow-y-auto">
        <div className="mb-2 px-2 text-[11px] font-normal uppercase tracking-[0.16em] text-[var(--ink-2)]">
          {t('sidebar.history')}
        </div>

        {hasNoSessions ? (
          <div className="px-2 py-2 text-sm text-[var(--ink-3)]">
            {t('sidebar.noConversations')}
          </div>
        ) : hasNoMatchingSessions ? (
          <div className="px-2 py-2 text-sm text-[var(--ink-3)]">{t('sidebar.noMatching')}</div>
        ) : (
          <div className="space-y-0.5">
            {filteredSessions.map((session) => (
              <ExpandedSessionItem
                key={session.id}
                currentSessionId={currentSessionId}
                session={session}
                editingSessionId={editingSessionId}
                editTitleInput={editTitleInput}
                sessionActionsDisabled={sessionActionsDisabled}
                sessionActionsDisabledReason={sessionActionsDisabledReason}
                onLoadSession={onLoadSession}
                onOpenMenu={onOpenMenu}
                onSessionItemKeyDown={onSessionItemKeyDown}
                onEditTitleInputChange={onEditTitleInputChange}
                onEditInputClick={onEditInputClick}
                onEditKeyDown={onEditKeyDown}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
