import { memo, useEffect, useRef, useState } from 'react';
import { t } from '@/shared/utils/i18n';
import {
  REASONING_BODY_CLASS,
  REASONING_PANEL_CLASS,
} from '@client/features/chat/presentation/chatBubbleParts/constants';

export const ReasoningIndicator = memo(function ReasoningIndicator({
  isStreaming,
  reasoning,
  initialOpen,
}: {
  isStreaming: boolean;
  reasoning?: string;
  initialOpen: boolean;
}) {
  const hasReasoning = Boolean(reasoning?.trim());
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMounted, setIsMounted] = useState(initialOpen && hasReasoning);
  const closeTimeoutRef = useRef<number | null>(null);
  const autoOpenedRef = useRef(initialOpen && hasReasoning);
  const openFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      if (openFrameRef.current !== null) {
        window.cancelAnimationFrame(openFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasReasoning || !initialOpen || autoOpenedRef.current) {
      return;
    }

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    autoOpenedRef.current = true;
    openFrameRef.current = window.requestAnimationFrame(() => {
      setIsMounted(true);
      setIsOpen(true);
      openFrameRef.current = null;
    });
  }, [hasReasoning, initialOpen]);

  const shouldRenderPanel = hasReasoning && isMounted;
  const isPanelOpen = hasReasoning && isOpen;

  const handleToggle = () => {
    if (!hasReasoning) {
      return;
    }

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (!isOpen) {
      setIsMounted(true);
      window.requestAnimationFrame(() => {
        setIsOpen(true);
      });
      return;
    }

    setIsOpen(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsMounted(false);
      closeTimeoutRef.current = null;
    }, 200);
  };

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={handleToggle}
        className="mb-2 text-left text-[11px] font-medium tracking-[0.02em] text-[var(--ink-2)] transition-colors hover:text-[var(--ink-1)]"
      >
        {isStreaming ? t('reasoning.streaming') : t('reasoning.completed')}{' '}
        {isPanelOpen ? t('reasoning.collapse') : t('reasoning.expand')}
      </button>
      {shouldRenderPanel ? (
        <div
          className={`${REASONING_PANEL_CLASS} ${
            isPanelOpen ? 'mb-0 grid-rows-[1fr] opacity-100' : 'mb-0 grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className={REASONING_BODY_CLASS}>
              <div className="whitespace-pre-wrap break-words leading-relaxed">{reasoning}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});
