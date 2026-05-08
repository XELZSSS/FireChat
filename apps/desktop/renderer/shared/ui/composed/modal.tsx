import { memo, useCallback, type ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export type ModalProps = {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  showOverlay?: boolean;
  onClose?: () => void;
  ariaDescribedBy?: string | false;
};

const DIALOG_OVERLAY_CLASS =
  'ui-overlay-motion fixed inset-0 z-70 bg-[var(--overlay-bg)] titlebar-no-drag';
const DIALOG_CONTENT_CLASS =
  'ui-surface-motion fixed inset-0 z-[71] m-auto h-fit max-h-[92vh] w-[calc(100vw-2rem)] overflow-hidden bg-[var(--bg-1)] ring-1 ring-[var(--line-1)] focus:outline-none';

type AriaDescriptionResolution = {
  contentProps: { 'aria-describedby'?: string | undefined };
  shouldRenderDescription: boolean;
};

const resolveAriaDescriptionProps = (ariaDescribedBy: ModalProps['ariaDescribedBy']) => {
  if (ariaDescribedBy === false) {
    return {
      contentProps: { 'aria-describedby': undefined as undefined },
      shouldRenderDescription: false,
    } satisfies AriaDescriptionResolution;
  }

  if (ariaDescribedBy) {
    return {
      contentProps: { 'aria-describedby': ariaDescribedBy },
      shouldRenderDescription: false,
    } satisfies AriaDescriptionResolution;
  }

  return { contentProps: {}, shouldRenderDescription: true } satisfies AriaDescriptionResolution;
};

const ModalComponent = ({
  isOpen,
  title,
  children,
  className,
  overlayClassName,
  showOverlay = true,
  onClose,
  ariaDescribedBy,
}: ModalProps) => {
  const { contentProps, shouldRenderDescription } = resolveAriaDescriptionProps(ariaDescribedBy);
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose?.();
      }
    },
    [onClose]
  );

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        {showOverlay ? (
          <DialogPrimitive.Overlay className={cn(DIALOG_OVERLAY_CLASS, overlayClassName)} />
        ) : null}
        <DialogPrimitive.Content {...contentProps} className={cn(DIALOG_CONTENT_CLASS, className)}>
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {shouldRenderDescription ? (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          ) : null}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

const Modal = memo(ModalComponent);
export default Modal;
