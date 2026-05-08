import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode, SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChatSession } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import { IconButton, Input } from '@/shared/ui';
import ButtonPrimitive from '@/shared/ui/primitives/button';
import {
  CheckIcon,
  CloseIcon,
  DeleteOutlineIcon,
  EditOutlinedIcon,
  MoreHorizIcon,
} from '@/shared/ui/icons';

type SessionEditorProps = {
  editTitleInput: string;
  onEditTitleInputChange: (value: string) => void;
  onEditInputClick: (event: MouseEvent) => void;
  onEditKeyDown: (event: KeyboardEvent) => void;
  onSaveEdit: (event: SyntheticEvent | MouseEvent) => void;
  onCancelEdit: (event: MouseEvent) => void;
};

type SessionActionsProps = {
  session: ChatSession;
  disabled: boolean;
  disabledReason: string | null;
  onOpenMenu: (event: MouseEvent<HTMLElement>, session: ChatSession, disabled: boolean) => void;
};

type SessionContextMenuProps = {
  open: boolean;
  session: ChatSession | null;
  x: number;
  y: number;
  disabled: boolean;
  disabledReason: string | null;
  onClose: () => void;
  onStartEdit: (event: MouseEvent, session: ChatSession) => void;
  onRequestDeleteSession: (event: MouseEvent, session: ChatSession) => void;
};

const MENU_OFFSET = 8;
const SESSION_CONTEXT_MENU_CLASS =
  'ui-menu-motion fixed z-[90] min-w-48 overflow-hidden border border-[var(--line-1)] bg-[var(--bg-1)] p-1';
const SESSION_CONTEXT_MENU_ITEM_BASE_CLASS =
  'flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm transition-[background-color,color,opacity] duration-[var(--motion-fast)] ease-[var(--motion-ease-standard)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';
const SESSION_CONTEXT_MENU_ITEM_NEUTRAL_CLASS =
  'text-[var(--ink-2)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-1)]';
const SESSION_CONTEXT_MENU_ITEM_DANGER_CLASS =
  'text-[var(--ink-2)] hover:bg-[var(--status-error)]/10 hover:text-[var(--ink-1)]';
const SESSION_CONTEXT_MENU_ICON_NEUTRAL_CLASS = 'text-[var(--ink-3)]';
const SESSION_CONTEXT_MENU_ICON_DANGER_CLASS = 'text-[var(--status-error)]';
const SESSION_CONTEXT_MENU_SEPARATOR_CLASS = 'my-1 border-t border-[var(--line-1)]';

export const SessionEditor = memo(function SessionEditor({
  editTitleInput,
  onEditTitleInputChange,
  onEditInputClick,
  onEditKeyDown,
  onSaveEdit,
  onCancelEdit,
}: SessionEditorProps) {
  return (
    <div className="flex w-full items-center gap-1" onClick={onEditInputClick}>
      <Input
        type="text"
        autoFocus
        value={editTitleInput}
        onChange={(event) => onEditTitleInputChange(event.target.value)}
        onKeyDown={onEditKeyDown}
        className="flex-1 px-2 text-xs"
        compact
      />
      <IconButton
        onClick={onSaveEdit}
        size="xs"
        aria-label={t('settings.modal.save')}
        title={t('settings.modal.save')}
      >
        <CheckIcon size={14} strokeWidth={2} />
      </IconButton>
      <IconButton
        onClick={onCancelEdit}
        danger
        size="xs"
        aria-label={t('settings.modal.cancel')}
        title={t('settings.modal.cancel')}
      >
        <CloseIcon size={14} strokeWidth={2} />
      </IconButton>
    </div>
  );
});

export const SessionActions = memo(function SessionActions({
  session,
  disabled,
  disabledReason,
  onOpenMenu,
}: SessionActionsProps) {
  return (
    <div className="flex items-center opacity-0 transition-opacity duration-[var(--motion-fast)] ease-[var(--motion-ease-standard)] group-hover:opacity-100 group-focus-within:opacity-100">
      <IconButton
        onClick={(event) => onOpenMenu(event, session, disabled)}
        disabled={disabled}
        size="sm"
        aria-label={t('sidebar.moreActions')}
        title={disabled ? (disabledReason ?? t('sidebar.moreActions')) : t('sidebar.moreActions')}
      >
        <MoreHorizIcon size={13} strokeWidth={2} />
      </IconButton>
    </div>
  );
});

const SessionContextMenuItem = memo(function SessionContextMenuItem({
  icon,
  label,
  danger = false,
  disabled = false,
  title,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="px-1 py-0.5">
      <ButtonPrimitive
        type="button"
        disabled={disabled}
        title={title}
        onClick={onClick}
        className={`${SESSION_CONTEXT_MENU_ITEM_BASE_CLASS} ${
          danger ? SESSION_CONTEXT_MENU_ITEM_DANGER_CLASS : SESSION_CONTEXT_MENU_ITEM_NEUTRAL_CLASS
        }`}
      >
        <span
          className={`flex shrink-0 items-center justify-center ${
            danger
              ? SESSION_CONTEXT_MENU_ICON_DANGER_CLASS
              : SESSION_CONTEXT_MENU_ICON_NEUTRAL_CLASS
          }`}
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </ButtonPrimitive>
    </div>
  );
});

export const SessionContextMenu = ({
  open,
  session,
  x,
  y,
  disabled,
  disabledReason,
  onClose,
  onStartEdit,
  onRequestDeleteSession,
}: SessionContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x, y });
  const itemTitle = disabled ? (disabledReason ?? undefined) : undefined;

  const setMenuRef = useCallback((node: HTMLDivElement | null) => {
    menuRef.current = node;
  }, []);

  const handleEditClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!session) {
        return;
      }

      onStartEdit(event, session);
      onClose();
    },
    [onClose, onStartEdit, session]
  );

  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!session) {
        return;
      }

      onRequestDeleteSession(event, session);
      onClose();
    },
    [onClose, onRequestDeleteSession, session]
  );

  useLayoutEffect(() => {
    if (!open || !menuRef.current) {
      return;
    }

    const { offsetWidth, offsetHeight } = menuRef.current;
    const clampedX = Math.max(
      MENU_OFFSET,
      Math.min(x, window.innerWidth - offsetWidth - MENU_OFFSET)
    );
    const clampedY = Math.max(
      MENU_OFFSET,
      Math.min(y, window.innerHeight - offsetHeight - MENU_OFFSET)
    );

    setPosition((current) =>
      current.x === clampedX && current.y === clampedY ? current : { x: clampedX, y: clampedY }
    );
  }, [open, x, y]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    };

    const handleContextMenu = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, open]);

  if (!open || !session || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={setMenuRef}
      style={{ left: position.x, top: position.y }}
      className={SESSION_CONTEXT_MENU_CLASS}
      role="menu"
      aria-label={t('sidebar.moreActions')}
      onContextMenu={(event) => event.preventDefault()}
    >
      <SessionContextMenuItem
        icon={<EditOutlinedIcon size={14} strokeWidth={2} />}
        label={t('sidebar.editTitle')}
        disabled={disabled}
        title={itemTitle}
        onClick={handleEditClick}
      />
      <div className={SESSION_CONTEXT_MENU_SEPARATOR_CLASS} aria-hidden="true" />
      <SessionContextMenuItem
        icon={<DeleteOutlineIcon size={14} strokeWidth={2} />}
        label={t('sidebar.deleteTitle')}
        danger
        disabled={disabled}
        title={itemTitle}
        onClick={handleDeleteClick}
      />
    </div>,
    document.body
  );
};
