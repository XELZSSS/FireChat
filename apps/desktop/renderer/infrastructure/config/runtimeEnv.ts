import type { FireChatRuntimeEnv, FireChatRuntimeEnvKey } from '@contracts/runtime-config';

const EMPTY_RUNTIME_ENV: FireChatRuntimeEnv = {};

export const getRuntimeEnv = (): FireChatRuntimeEnv => {
  if (typeof window === 'undefined') {
    return EMPTY_RUNTIME_ENV;
  }

  return window.firechat?.config?.env ?? EMPTY_RUNTIME_ENV;
};

export const getRuntimeEnvValue = (key: FireChatRuntimeEnvKey): string | undefined => {
  const value = getRuntimeEnv()[key];
  return typeof value === 'string' ? value : undefined;
};
