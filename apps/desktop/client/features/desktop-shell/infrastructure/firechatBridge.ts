import type { FireChatDesktopBridge } from '@contracts/desktop';

export const noopUnsubscribe = (): void => {};

export const hasFireChatBridge = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.firechat);

export const getFireChatBridge = (): FireChatDesktopBridge => {
  if (typeof window === 'undefined') {
    throw new Error('FireChat bridge is unavailable outside the renderer window.');
  }

  if (!window.firechat) {
    throw new Error('FireChat bridge is unavailable in the renderer window.');
  }

  return window.firechat;
};

export const getBridgeNamespace = <K extends keyof FireChatDesktopBridge>(
  namespace: K
): FireChatDesktopBridge[K] => {
  const bridge = getFireChatBridge();
  const candidate = bridge?.[namespace];
  if (!candidate) {
    throw new Error(`FireChat bridge namespace "${String(namespace)}" is unavailable.`);
  }

  return candidate as FireChatDesktopBridge[K];
};
