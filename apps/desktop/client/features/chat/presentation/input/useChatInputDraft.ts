import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  readSessionDraft,
  writeSessionDraft,
} from '@client/features/chat/presentation/input/chatInputHelpers';

type UseChatInputDraftProps = {
  sessionId: string;
};

const DRAFT_SAVE_DELAY_MS = 350;

export const useChatInputDraft = ({ sessionId }: UseChatInputDraftProps) => {
  const initialInput = useMemo(() => readSessionDraft(sessionId), [sessionId]);
  const currentInputRef = useRef(initialInput);
  const draftSaveTimerRef = useRef<number | null>(null);

  const clearDraftTimer = useCallback(() => {
    if (draftSaveTimerRef.current === null) return;
    window.clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = null;
  }, []);

  const persistDraftNow = useCallback(
    (value: string) => {
      writeSessionDraft(sessionId, value);
    },
    [sessionId]
  );

  const setCurrentInput = useCallback((value: string) => {
    currentInputRef.current = value;
  }, []);

  const persistDraft = useCallback(
    (value: string) => {
      clearDraftTimer();
      draftSaveTimerRef.current = window.setTimeout(() => {
        persistDraftNow(value);
        clearDraftTimer();
      }, DRAFT_SAVE_DELAY_MS);
    },
    [clearDraftTimer, persistDraftNow]
  );

  const clearDraft = useCallback(() => {
    clearDraftTimer();
    currentInputRef.current = '';
    persistDraftNow('');
  }, [clearDraftTimer, persistDraftNow]);

  useEffect(
    () => () => {
      clearDraftTimer();
      persistDraftNow(currentInputRef.current);
    },
    [clearDraftTimer, persistDraftNow]
  );

  return {
    clearDraft,
    currentInputRef,
    initialInput,
    persistDraft,
    persistDraftNow,
    setCurrentInput,
  };
};

