import {
  readAppStorage,
  removeAppStorage,
  writeAppStorage,
} from '@/infrastructure/persistence/storageKeys';
import { isAvailableChatInputEmoji } from '@client/features/chat/presentation/input/chatInputEmoji';

export const CONTAINER_CLASS = 'w-full';
export const INPUT_SHELL_CLASS =
  'relative flex h-[6.75rem] items-center gap-2 border border-[var(--line-1)] bg-[var(--bg-1)] px-2.5 py-2 shadow-none';
export const TEXTAREA_CLASS =
  'h-[2.75rem] max-h-[2.75rem] w-full resize-none overflow-y-auto overscroll-contain break-words bg-transparent px-3 py-2 text-[14px] leading-6 tracking-[0.003em] text-[var(--ink-1)] placeholder:text-[var(--ink-3)] focus:outline-none scrollbar-hide';
export const ACTION_BUTTON_CLASS =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center p-0 leading-none transform-gpu transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-[var(--motion-base)] ease-[var(--motion-ease-standard)] motion-safe:active:scale-[0.985] focus-visible:outline-none [&>span]:inline-flex [&>span]:h-full [&>span]:w-full [&>span]:items-center [&>span]:justify-center [&>span]:leading-none [&_svg]:block [&_svg]:shrink-0';

type SessionDraftMap = Record<string, string>;
const MAX_RECENT_EMOJIS = 18;

const parseSessionDraftMap = (value: string | null): SessionDraftMap | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'string'
      )
    );
  } catch {
    return null;
  }
};

export const readSessionDraft = (sessionId: string): string => {
  const stored = readAppStorage('inputDraft');
  const drafts = parseSessionDraftMap(stored);
  return drafts?.[sessionId] ?? '';
};

export const writeSessionDraft = (sessionId: string, value: string): void => {
  const drafts = parseSessionDraftMap(readAppStorage('inputDraft')) ?? {};
  const nextValue = value.length > 0 ? value : '';
  if (nextValue) {
    drafts[sessionId] = value;
  } else {
    delete drafts[sessionId];
  }
  if (Object.keys(drafts).length === 0) {
    removeAppStorage('inputDraft');
    return;
  }
  writeAppStorage('inputDraft', JSON.stringify(drafts));
};

const parseRecentEmojis = (value: string | null): string[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
    );
  } catch {
    return [];
  }
};

export const readRecentEmojis = (): string[] => {
  return parseRecentEmojis(readAppStorage('recentEmojis'))
    .filter(isAvailableChatInputEmoji)
    .slice(0, MAX_RECENT_EMOJIS);
};

export const pushRecentEmoji = (emoji: string): string[] => {
  const value = emoji.trim();
  if (!value || !isAvailableChatInputEmoji(value)) {
    return readRecentEmojis();
  }

  const nextRecent = [value, ...readRecentEmojis().filter((entry) => entry !== value)].slice(
    0,
    MAX_RECENT_EMOJIS
  );
  writeAppStorage('recentEmojis', JSON.stringify(nextRecent));
  return nextRecent;
};

export const clearRecentEmojis = (): void => {
  removeAppStorage('recentEmojis');
};

