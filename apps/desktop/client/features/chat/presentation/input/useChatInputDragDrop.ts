import { useCallback, useRef, useState } from 'react';
import type { DragEvent } from 'react';

type UseChatInputDragDropOptions = {
  disabled: boolean;
  appendFiles: (files: File[]) => Promise<void>;
};

export const useChatInputDragDrop = ({ disabled, appendFiles }: UseChatInputDragDropOptions) => {
  const dragDepthRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);

  const hasDraggedFiles = useCallback((event: DragEvent<HTMLElement>): boolean => {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files');
  }, []);

  const resetDragState = useCallback(() => {
    dragDepthRef.current = 0;
    setIsDragActive(false);
  }, []);

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!hasDraggedFiles(event)) {
        return;
      }

      event.preventDefault();
      if (disabled) {
        resetDragState();
        return;
      }

      dragDepthRef.current += 1;
      setIsDragActive(true);
    },
    [disabled, hasDraggedFiles, resetDragState]
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!hasDraggedFiles(event)) {
        return;
      }

      event.preventDefault();
      if (disabled) {
        resetDragState();
        return;
      }

      event.dataTransfer.dropEffect = 'copy';
      if (!isDragActive) {
        setIsDragActive(true);
      }
    },
    [disabled, hasDraggedFiles, isDragActive, resetDragState]
  );

  const handleDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!hasDraggedFiles(event)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsDragActive(false);
      }
    },
    [hasDraggedFiles]
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      if (!hasDraggedFiles(event)) {
        return;
      }

      event.preventDefault();
      resetDragState();
      if (disabled) {
        return;
      }

      await appendFiles(Array.from(event.dataTransfer.files ?? []));
    },
    [appendFiles, disabled, hasDraggedFiles, resetDragState]
  );

  return {
    isDragActive: disabled ? false : isDragActive,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
