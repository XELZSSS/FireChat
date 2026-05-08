import { forwardRef, memo } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/ui/cn';
import ButtonPrimitive from '@/shared/ui/primitives/button';

export type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'icon' | 'icon-sm' | 'icon-xs';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'border border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)] shadow-none hover:border-[var(--accent-strong)] hover:bg-[var(--accent-strong)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--ink-2)] hover:bg-[var(--bg-2)]/72 hover:text-[var(--ink-1)]',
  subtle:
    'border border-[var(--line-1)] bg-[var(--bg-1)] text-[var(--ink-1)] hover:border-[var(--line-1)] hover:bg-[var(--bg-2)]/84',
  danger:
    'border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--text-on-brand)] hover:border-[var(--status-error-border)] hover:bg-[var(--status-error-bg)]/88',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-[12px]',
  md: 'h-9 px-3.5 text-sm',
  icon: 'h-8 w-8',
  'icon-sm': 'h-7.5 w-7.5',
  'icon-xs': 'h-6.5 w-6.5',
};

const BUTTON_BASE_CLASS = 'font-normal tracking-[0.01em]';

const resolveButtonClassName = ({
  variant,
  size,
  className,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  className?: string;
}) => cn(BUTTON_BASE_CLASS, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);

const ButtonBase = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ghost', size = 'md', className, type = 'button', ...props }, ref) => {
    return (
      <ButtonPrimitive
        ref={ref}
        type={type}
        className={resolveButtonClassName({ variant, size, className })}
        {...props}
      />
    );
  }
);

ButtonBase.displayName = 'Button';

const Button = memo(ButtonBase);
export default Button;
