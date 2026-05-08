import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { cn } from '@/shared/ui/cn';

export type SwitchPrimitiveProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'checked' | 'defaultChecked' | 'onChange' | 'role'
> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

const SWITCH_ROOT_BASE_CLASS = [
  'peer inline-flex h-5 w-9 shrink-0 items-center',
  'border border-[var(--line-1)] bg-[var(--bg-1)]',
  'transition-[background-color,border-color,box-shadow] duration-[var(--motion-base)] ease-[var(--motion-ease-standard)]',
  'focus-visible:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'data-[state=checked]:border-[var(--accent)]',
  'data-[state=checked]:bg-[var(--accent)]',
].join(' ');

const SWITCH_THUMB_BASE_CLASS = [
  'pointer-events-none block h-3.5 w-3.5 bg-[var(--ink-3)] shadow-sm',
  'translate-x-0.5 transform-gpu transition-[transform,background-color] duration-[var(--motion-base)] ease-[var(--motion-ease-soft)]',
  'data-[state=checked]:translate-x-4',
  'data-[state=checked]:bg-[var(--text-on-accent)]',
].join(' ');

const SwitchRoot = forwardRef<HTMLButtonElement, SwitchPrimitiveProps>(
  ({ checked, className, children, onCheckedChange, onClick, type = 'button', ...props }, ref) => {
    const state = checked ? 'checked' : 'unchecked';
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        ref={ref}
        type={type}
        role="switch"
        aria-checked={checked}
        data-state={state}
        className={cn(SWITCH_ROOT_BASE_CLASS, className)}
        onClick={handleClick}
        {...props}
      >
        {children ?? <span className={SWITCH_THUMB_BASE_CLASS} data-state={state} />}
      </button>
    );
  }
);

SwitchRoot.displayName = 'SwitchPrimitive';

export default SwitchRoot;
