const SIDEBAR_SESSION_ROW_BASE_CLASS =
  'group flex cursor-pointer items-center justify-between px-3 py-2 text-[13px] transition-[background-color,color,border-color,opacity] duration-[var(--motion-base)] ease-[var(--motion-ease-standard)] focus-visible:outline-none';
const SIDEBAR_SESSION_ROW_ACTIVE_CLASS =
  'bg-[var(--bg-2)] text-[var(--ink-1)] ring-1 ring-[var(--line-1)]';
const SIDEBAR_SESSION_ROW_IDLE_CLASS =
  'text-[var(--ink-2)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-1)]';
const SIDEBAR_SESSION_ROW_DISABLED_CLASS = 'cursor-not-allowed text-[var(--ink-3)] opacity-55';
const COLLAPSED_SESSION_CARD_BASE_CLASS =
  'group flex h-9 w-9 shrink-0 items-center justify-center border px-1 text-center transition-[background-color,color,border-color,opacity] duration-[var(--motion-base)] ease-[var(--motion-ease-standard)] focus-visible:outline-none';
const COLLAPSED_SESSION_CARD_ACTIVE_CLASS =
  'border-[var(--line-1)] bg-[var(--bg-2)] text-[var(--ink-1)]';
const COLLAPSED_SESSION_CARD_IDLE_CLASS =
  'border-transparent text-[var(--ink-3)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-1)]';

export const SIDEBAR_FOOTER_BUTTON_CLASS =
  'flex w-full items-center justify-start gap-3 bg-transparent text-sm text-[var(--ink-1)] hover:bg-transparent';
export const SIDEBAR_MATCHED_TEXT_CLASS = 'text-[13px] font-normal tracking-[-0.018em]';
export const SIDEBAR_NOTICE_CLASS =
  'mb-3 border border-[var(--line-1)] bg-[var(--bg-2)] px-3 py-2 text-xs text-[var(--ink-2)]';

export const getSessionInteractionState = (
  sessionId: string,
  currentSessionId: string,
  sessionActionsDisabled: boolean
) => {
  const isCurrentSession = currentSessionId === sessionId;
  return {
    isCurrentSession,
    isDisabled: sessionActionsDisabled && !isCurrentSession,
  };
};

export const getCollapsedSessionCardClassName = (
  isCurrentSession: boolean,
  isDisabled: boolean
): string => {
  if (isCurrentSession) {
    return `${COLLAPSED_SESSION_CARD_BASE_CLASS} ${COLLAPSED_SESSION_CARD_ACTIVE_CLASS}`;
  }

  if (isDisabled) {
    return `${COLLAPSED_SESSION_CARD_BASE_CLASS} ${SIDEBAR_SESSION_ROW_DISABLED_CLASS}`;
  }

  return `${COLLAPSED_SESSION_CARD_BASE_CLASS} ${COLLAPSED_SESSION_CARD_IDLE_CLASS}`;
};

export const getExpandedSessionRowClassName = (
  isCurrentSession: boolean,
  isEditing: boolean,
  isDisabled: boolean
): string => {
  if (isCurrentSession && !isEditing) {
    return `${SIDEBAR_SESSION_ROW_BASE_CLASS} ${SIDEBAR_SESSION_ROW_ACTIVE_CLASS}`;
  }

  if (isDisabled) {
    return `${SIDEBAR_SESSION_ROW_BASE_CLASS} ${SIDEBAR_SESSION_ROW_DISABLED_CLASS}`;
  }

  return `${SIDEBAR_SESSION_ROW_BASE_CLASS} ${SIDEBAR_SESSION_ROW_IDLE_CLASS}`;
};

export const getSessionTitle = (
  title: string,
  isDisabled: boolean,
  disabledReason?: string | null
): string | undefined => {
  if (!isDisabled) {
    return title;
  }

  return disabledReason ?? title;
};
