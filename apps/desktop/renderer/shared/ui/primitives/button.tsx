import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/ui/cn';

export type ButtonPrimitiveProps = ButtonHTMLAttributes<HTMLButtonElement>;

const BUTTON_PRIMITIVE_BASE_CLASS = [
  'inline-flex items-center justify-center whitespace-nowrap',
  'transform-gpu transition-[background-color,border-color,color,box-shadow,transform,opacity]',
  'duration-[var(--motion-base)] ease-[var(--motion-ease-standard)]',
  'motion-safe:active:scale-[0.985]',
  'focus-visible:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

const ButtonPrimitive = forwardRef<HTMLButtonElement, ButtonPrimitiveProps>(
  ({ className, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(BUTTON_PRIMITIVE_BASE_CLASS, className)}
        {...props}
      />
    );
  }
);

ButtonPrimitive.displayName = 'ButtonPrimitive';

export default ButtonPrimitive;
