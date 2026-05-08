import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/ui/cn';

export type InputPrimitiveProps = InputHTMLAttributes<HTMLInputElement>;

const INPUT_PRIMITIVE_BASE_CLASS = [
  ' border border-[var(--line-1)] bg-[var(--bg-1)] text-[var(--ink-1)] outline-none',
  'transition-[border-color,background-color,box-shadow,color,opacity]',
  'duration-[var(--motion-base)] ease-[var(--motion-ease-standard)]',
  'tracking-[0.003em] placeholder:text-[var(--ink-3)] placeholder:tracking-[0.01em]',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

const InputPrimitive = forwardRef<HTMLInputElement, InputPrimitiveProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn(INPUT_PRIMITIVE_BASE_CLASS, className)} {...props} />;
  }
);

InputPrimitive.displayName = 'InputPrimitive';

export default InputPrimitive;
