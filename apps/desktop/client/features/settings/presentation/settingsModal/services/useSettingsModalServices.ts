import { useCallback } from 'react';
import type { UpdaterStatus } from '@contracts/updater';
import {
  checkForUpdates,
  openUpdateDownload,
} from '@client/features/desktop-shell/infrastructure/updater/updaterClient';
import {
  getUpdateStatusText,
  useClearCacheFeedback,
} from '@client/features/settings/presentation/settingsModal/sections/SettingsModalParts';
import { useSettingsClearCache } from '@client/features/settings/presentation/settingsModal/services/useSettingsClearCache';
import { openExternalUrl } from '@client/features/desktop-shell/infrastructure/nativeDesktop';

const AUTHOR_URL = 'https://github.com/XELZSSS';

type UseSettingsModalServicesOptions = {
  updaterStatus: UpdaterStatus;
  interactionLockReason?: string | null;
};

export const useSettingsModalServices = ({
  updaterStatus,
  interactionLockReason = null,
}: UseSettingsModalServicesOptions) => {
  const handleCheckForUpdates = useCallback(() => checkForUpdates(), []);
  const handleOpenUpdateDownload = useCallback(() => openUpdateDownload(), []);
  const handleOpenAuthorPage = useCallback(async () => {
    if (await openExternalUrl(AUTHOR_URL)) {
      return;
    }

    window.open(AUTHOR_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const {
    clearCacheNotice,
    clearCacheStatus,
    showClearCachePending,
    showClearCacheSuccess,
    showClearCacheError,
  } = useClearCacheFeedback();

  const {
    clearCacheConfirmDescription,
    isClearCacheConfirmOpen,
    handleOpenClearCacheConfirm,
    handleCancelClearCache,
    handleConfirmClearCache,
  } = useSettingsClearCache({
    interactionLockReason,
    showClearCachePending,
    showClearCacheSuccess,
    showClearCacheError,
  });

  const updateStatusText = getUpdateStatusText(updaterStatus);

  return {
    updateStatusText,
    handleCheckForUpdates,
    handleOpenUpdateDownload,
    handleOpenAuthorPage,
    clearCacheNotice,
    clearCacheStatus,
    clearCacheConfirmDescription,
    isClearCacheConfirmOpen,
    handleOpenClearCacheConfirm,
    handleCancelClearCache,
    handleConfirmClearCache,
  };
};
