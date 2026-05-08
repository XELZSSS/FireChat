import { forwardRef, memo } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import Button from '@/shared/ui/composed/button';
import type { ButtonSize, ButtonVariant } from '@/shared/ui/composed/button';
import { cn } from '@/shared/ui/cn';

type IconButtonVariant = Extract<ButtonVariant, 'ghost' | 'subtle'>;
type IconButtonSize = 'md' | 'sm' | 'xs';

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  danger?: boolean;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
};

const ICON_BUTTON_TONES = {
  default: 'text-[var(--ink-3)]',
  subtle: 'text-[var(--ink-2)]',
  active: 'border-[var(--line-1)] bg-[var(--bg-2)] text-[var(--ink-1)]',
  danger: 'text-[var(--ink-3)] hover:text-[var(--status-error)]',
} as const;

const ICON_BUTTON_SIZES: Record<IconButtonSize, ButtonSize> = {
  md: 'icon',
  sm: 'icon-sm',
  xs: 'icon-xs',
};

const resolveIconButtonSize = (size: IconButtonSize): ButtonSize => ICON_BUTTON_SIZES[size];

const resolveToneClassName = (active: boolean, danger: boolean, variant: IconButtonVariant) => {
  if (danger) return ICON_BUTTON_TONES.danger;
  if (active) return ICON_BUTTON_TONES.active;
  return variant === 'subtle' ? ICON_BUTTON_TONES.subtle : ICON_BUTTON_TONES.default;
};

const resolveIconButtonClassName = ({
  active,
  danger,
  variant,
  className,
}: {
  active: boolean;
  danger: boolean;
  variant: IconButtonVariant;
  className?: string;
}) => cn(resolveToneClassName(active, danger, variant), className);

const IconButtonBase = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { active = false, danger = false, variant = 'ghost', size = 'md', className, ...props },
    ref
  ) => (
    <Button
      ref={ref}
      size={resolveIconButtonSize(size)}
      variant={variant}
      className={resolveIconButtonClassName({ active, danger, variant, className })}
      {...props}
    />
  )
);

IconButtonBase.displayName = 'IconButton';

const IconButton = memo(IconButtonBase);
export default IconButton;
