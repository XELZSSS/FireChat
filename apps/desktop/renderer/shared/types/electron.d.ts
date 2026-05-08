import type { FireChatDesktopBridge } from '@contracts/desktop';

export {};

declare global {
  interface Window {
    firechat?: FireChatDesktopBridge;
  }
}
