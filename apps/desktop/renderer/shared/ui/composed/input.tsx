import { forwardRef, memo } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/ui/cn';
import InputPrimitive from '@/shared/ui/primitives/input';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  compact?: boolean;
};

const INPUT_SIZE_CLASS = {
  compact: 'px-2.5 py-1.5 text-sm',
  default: 'px-3 py-2 text-sm',
} as const;

const resolveInputClassName = (compact: boolean, className?: string) =>
  cn(INPUT_SIZE_CLASS[compact ? 'compact' : 'default'], className);

const InputBase = forwardRef<HTMLInputElement, InputProps>(
  ({ className, compact = false, ...props }, ref) => (
    <InputPrimitive ref={ref} className={resolveInputClassName(compact, className)} {...props} />
  )
);

InputBase.displayName = 'Input';

const Input = memo(InputBase);
export default Input;
