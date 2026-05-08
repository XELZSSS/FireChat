import type { KeyboardEvent, MouseEvent, RefObject, SyntheticEvent } from 'react';
import type { ChatSession } from '@/shared/types/chat';

export type SidebarSharedListHandlers = {
  onLoadSession: (session: ChatSession) => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>, session: ChatSession, disabled: boolean) => void;
  onSessionItemKeyDown: (
    event: KeyboardEvent<HTMLDivElement>,
    session: ChatSession,
    disabled: boolean
  ) => void;
};

export type SidebarSessionItemSharedProps = {
  currentSessionId: string;
  session: ChatSession;
  sessionActionsDisabled: boolean;
  sessionActionsDisabledReason: string | null;
} & SidebarSharedListHandlers;

export type SidebarExpandedSessionItemProps = SidebarSessionItemSharedProps & {
  editingSessionId: string | null;
  editTitleInput: string;
  onEditTitleInputChange: (value: string) => void;
  onEditInputClick: (e: MouseEvent) => void;
  onEditKeyDown: (e: KeyboardEvent) => void;
  onSaveEdit: (e: SyntheticEvent | MouseEvent) => void;
  onCancelEdit: (e: MouseEvent) => void;
};

export type SidebarCollapsedListProps = {
  currentSessionId: string;
  sessions: ChatSession[];
  sessionActionsDisabled: boolean;
  sessionActionsDisabledReason: string | null;
  listContainerRef: RefObject<HTMLDivElement | null>;
} & SidebarSharedListHandlers;

export type SidebarExpandedListProps = {
  currentSessionId: string;
  filteredSessions: ChatSession[];
  sessions: ChatSession[];
  searchQuery: string;
  editingSessionId: string | null;
  editTitleInput: string;
  sessionActionsDisabled: boolean;
  sessionActionsDisabledReason: string | null;
  sessionNotice: string | null;
  expandedContentId: string;
  listContainerRef: RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onEditTitleInputChange: (value: string) => void;
  onEditInputClick: (e: MouseEvent) => void;
  onEditKeyDown: (e: KeyboardEvent) => void;
  onSaveEdit: (e: SyntheticEvent | MouseEvent) => void;
  onCancelEdit: (e: MouseEvent) => void;
} & SidebarSharedListHandlers;
