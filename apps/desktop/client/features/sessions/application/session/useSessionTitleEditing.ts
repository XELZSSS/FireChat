import { useCallback, useState } from 'react';
import type { KeyboardEvent, MouseEvent, SyntheticEvent } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ChatSession } from '@/shared/types/chat';
import { updateSessionTitle } from '@/infrastructure/persistence/sessionStore';

type UseSessionTitleEditingOptions = {
  setSessions: Dispatch<SetStateAction<ChatSession[]>>;
};

export const useSessionTitleEditing = ({ setSessions }: UseSessionTitleEditingOptions) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  const resetEditState = useCallback(() => {
    setEditingSessionId(null);
    setEditTitleInput('');
  }, []);

  const handleStartEdit = useCallback((event: MouseEvent, session: ChatSession) => {
    event.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleInput(session.title);
  }, []);

  const handleCancelEdit = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      resetEditState();
    },
    [resetEditState]
  );

  const commitTitleEdit = useCallback(() => {
    const targetSessionId = editingSessionId;
    const nextTitle = editTitleInput.trim();
    if (!targetSessionId || !nextTitle) {
      return;
    }

    void updateSessionTitle(targetSessionId, nextTitle)
      .then((updated) => {
        setSessions(updated);
        let shouldClearEditInput = false;
        setEditingSessionId((current) => {
          if (current === targetSessionId) {
            shouldClearEditInput = true;
            return null;
          }
          return current;
        });
        if (shouldClearEditInput) {
          setEditTitleInput('');
        }
      })
      .catch((error) => {
        console.error(`Failed to rename session "${targetSessionId}":`, error);
      });
  }, [editTitleInput, editingSessionId, setSessions]);

  const handleSaveEdit = useCallback(
    (event: SyntheticEvent | MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      commitTitleEdit();
    },
    [commitTitleEdit]
  );

  const handleEditInputClick = useCallback((event: MouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleEditKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        commitTitleEdit();
      } else if (event.key === 'Escape') {
        resetEditState();
      }
    },
    [commitTitleEdit, resetEditState]
  );

  return {
    editingSessionId,
    editTitleInput,
    setEditTitleInput,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleEditInputClick,
    handleEditKeyDown,
    resetEditState,
  };
};
