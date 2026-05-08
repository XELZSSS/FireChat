import { memo } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { ChatBubbleOutlineIcon } from '@/shared/ui/icons';
import { SessionActions, SessionEditor } from '@client/features/sessions/presentation/sidebarParts';
import {
  getCollapsedSessionCardClassName,
  getExpandedSessionRowClassName,
  getSessionInteractionState,
  getSessionTitle,
  SIDEBAR_MATCHED_TEXT_CLASS,
} from '@client/features/sessions/presentation/sidebarHelpers';
import type {
  SidebarExpandedSessionItemProps,
  SidebarSessionItemSharedProps,
} from '@client/features/sessions/presentation/sidebarViews/types';

const resolveSessionItemBehavior = ({
  currentSessionId,
  session,
  sessionActionsDisabled,
  sessionActionsDisabledReason,
  onLoadSession,
  onOpenMenu,
  onSessionItemKeyDown,
}: SidebarSessionItemSharedProps) => {
  const { isCurrentSession, isDisabled } = getSessionInteractionState(
    session.id,
    currentSessionId,
    sessionActionsDisabled
  );
  const isMenuDisabled = sessionActionsDisabled || isDisabled;

  return {
    isCurrentSession,
    isDisabled,
    isMenuDisabled,
    handleClick: () => {
      if (!isDisabled) {
        onLoadSession(session);
      }
    },
    handleContextMenu: (event: MouseEvent<HTMLElement>) => {
      onOpenMenu(event, session, isMenuDisabled);
    },
    handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      onSessionItemKeyDown(event, session, isDisabled);
    },
    title: getSessionTitle(session.title, isDisabled, sessionActionsDisabledReason),
  };
};

export const CollapsedSessionItem = memo(function CollapsedSessionItem({
  currentSessionId,
  session,
  sessionActionsDisabled,
  sessionActionsDisabledReason,
  onLoadSession,
  onOpenMenu,
  onSessionItemKeyDown,
}: SidebarSessionItemSharedProps) {
  const { isCurrentSession, isDisabled, handleClick, handleContextMenu, handleKeyDown, title } =
    resolveSessionItemBehavior({
      currentSessionId,
      session,
      sessionActionsDisabled,
      sessionActionsDisabledReason,
      onLoadSession,
      onOpenMenu,
      onSessionItemKeyDown,
    });

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled || undefined}
      aria-current={isCurrentSession ? 'page' : undefined}
      title={title}
      className={getCollapsedSessionCardClassName(isCurrentSession, isDisabled)}
    >
      <ChatBubbleOutlineIcon className="text-current" size={15} strokeWidth={2} />
    </div>
  );
});

export const ExpandedSessionItem = memo(function ExpandedSessionItem({
  currentSessionId,
  session,
  editingSessionId,
  editTitleInput,
  sessionActionsDisabled,
  sessionActionsDisabledReason,
  onLoadSession,
  onOpenMenu,
  onSessionItemKeyDown,
  onEditTitleInputChange,
  onEditInputClick,
  onEditKeyDown,
  onSaveEdit,
  onCancelEdit,
}: SidebarExpandedSessionItemProps) {
  const {
    isCurrentSession,
    isDisabled,
    isMenuDisabled,
    handleClick,
    handleContextMenu,
    handleKeyDown,
  } = resolveSessionItemBehavior({
    currentSessionId,
    session,
    sessionActionsDisabled,
    sessionActionsDisabledReason,
    onLoadSession,
    onOpenMenu,
    onSessionItemKeyDown,
  });
  const isEditing = editingSessionId === session.id;
  const title = isDisabled ? (sessionActionsDisabledReason ?? undefined) : undefined;

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isEditing || isDisabled ? -1 : 0}
      aria-disabled={isDisabled || undefined}
      aria-current={isCurrentSession && !isEditing ? 'page' : undefined}
      title={title}
      className={getExpandedSessionRowClassName(isCurrentSession, isEditing, isDisabled)}
    >
      {isEditing ? (
        <SessionEditor
          editTitleInput={editTitleInput}
          onEditTitleInputChange={onEditTitleInputChange}
          onEditInputClick={onEditInputClick}
          onEditKeyDown={onEditKeyDown}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
        />
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ChatBubbleOutlineIcon
              className="flex-shrink-0 text-[var(--ink-3)]"
              size={14}
              strokeWidth={2}
            />
            <span className={`truncate ${SIDEBAR_MATCHED_TEXT_CLASS}`}>{session.title}</span>
          </div>
          <SessionActions
            session={session}
            disabled={isMenuDisabled}
            disabledReason={sessionActionsDisabledReason}
            onOpenMenu={onOpenMenu}
          />
        </>
      )}
    </div>
  );
});
