import { DEFAULT_UPDATER_STATUS, type UpdaterStatus } from '@contracts/updater';
import {
  getBridgeNamespace,
  hasFireChatBridge,
  noopUnsubscribe,
} from '@client/features/desktop-shell/infrastructure/firechatBridge';

export { DEFAULT_UPDATER_STATUS };
export type { UpdaterStatus };

export const getUpdaterStatus = async (): Promise<UpdaterStatus> => {
  if (!hasFireChatBridge()) {
    return DEFAULT_UPDATER_STATUS;
  }

  return getBridgeNamespace('updater').getStatus();
};

export const subscribeUpdaterStatus = (callback: (status: UpdaterStatus) => void): (() => void) => {
  if (!hasFireChatBridge()) {
    return noopUnsubscribe;
  }

  return getBridgeNamespace('updater').onStatus(callback);
};

export const checkForUpdates = async (): Promise<void> => {
  if (!hasFireChatBridge()) {
    return;
  }

  await getBridgeNamespace('updater').check();
};

export const openUpdateDownload = async (): Promise<void> => {
  if (!hasFireChatBridge()) {
    return;
  }

  await getBridgeNamespace('updater').openDownload();
};
