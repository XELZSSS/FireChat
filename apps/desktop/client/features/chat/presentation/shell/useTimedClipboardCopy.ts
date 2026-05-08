import { useCallback, useEffect, useRef, useState } from 'react';

type UseTimedClipboardCopyOptions = {
  resetDelayMs?: number;
  errorMessage?: string;
};

export const useTimedClipboardCopy = ({
  resetDelayMs = 1200,
  errorMessage = 'Failed to copy text:',
}: UseTimedClipboardCopyOptions = {}) => {
  const [isCopied, setIsCopied] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = null;
  }, []);

  useEffect(() => clearResetTimeout, [clearResetTimeout]);

  const copyText = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) {
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        clearResetTimeout();
        resetTimeoutRef.current = window.setTimeout(() => {
          setIsCopied(false);
          resetTimeoutRef.current = null;
        }, resetDelayMs);
        return true;
      } catch (error) {
        console.error(errorMessage, error);
        return false;
      }
    },
    [clearResetTimeout, errorMessage, resetDelayMs]
  );

  return {
    isCopied,
    copyText,
  };
};
