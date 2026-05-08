import { useCallback } from 'react';
import type { ChangeEvent } from 'react';

export const useSelectValueHandler = <T extends string>(onChange: (value: T) => void) =>
  useCallback((value: string) => onChange(value as T), [onChange]);

export const useInputValueHandler = (onChange: (value: string) => void) =>
  useCallback((event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value), [onChange]);
