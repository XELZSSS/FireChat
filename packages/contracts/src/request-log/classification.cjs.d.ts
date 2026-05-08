import type { RequestLogErrorType } from './index';

export type FriendlyErrorType = 'auth' | 'quota' | 'safety' | 'network' | 'overloaded' | 'generic';

export function classifyRequestLogError(options?: {
  message?: string;
  statusCode?: number;
}): RequestLogErrorType;

export function classifyFriendlyError(options?: {
  message?: string;
  statusCode?: number;
}): FriendlyErrorType;
