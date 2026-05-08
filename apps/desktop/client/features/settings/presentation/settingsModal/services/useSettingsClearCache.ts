import { useCallback, useState } from 'react';
import { t } from '@/shared/utils/i18n';
import {
  clearDesktopRequestLogs,
  resetDesktopLocalData,
} from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import {
  beginLocalDataReset,
  endLocalDataReset,
} from '@/infrastructure/persistence/localDataResetState';

type UseSettingsClearCacheOptions = {
  interactionLockReason: string | null;
  showClearCachePending: () => void;
  showClearCacheSuccess: (notice?: string) => void;
  showClearCacheError: (notice?: string) => void;
};

const getResetErrorMessage = (error: unknown): string => {
  return error instanceof Error && error.message
    ? `${t('settings.clearCache.failed')}: ${error.message}`
    : t('settings.clearCache.failed');
};

export const useSettingsClearCache = ({
  interactionLockReason,
  showClearCachePending,
  showClearCacheSuccess,
  showClearCacheError,
}: UseSettingsClearCacheOptions) => {
  const [isClearCacheConfirmOpen, setIsClearCacheConfirmOpen] = useState(false);
  const clearCacheConfirmDescription = t('settings.clearCache.confirm');

  const handleClearCache = useCallback(async () => {
    showClearCachePending();
    beginLocalDataReset();
    try {
      await clearDesktopRequestLogs();
      const result = await resetDesktopLocalData();
      if (result?.ok) {
        showClearCacheSuccess(
          result.action === 'exit'
            ? t('settings.clearCache.successExit')
            : t('settings.clearCache.success')
        );
        return;
      }

      endLocalDataReset();
      showClearCacheError();
    } catch (error) {
      endLocalDataReset();
      console.error('Failed to reset local data:', error);
      showClearCacheError(getResetErrorMessage(error));
    }
  }, [showClearCacheError, showClearCachePending, showClearCacheSuccess]);

  const handleOpenClearCacheConfirm = useCallback(() => {
    if (!interactionLockReason) {
      setIsClearCacheConfirmOpen(true);
    }
  }, [interactionLockReason]);

  const handleCancelClearCache = useCallback(() => setIsClearCacheConfirmOpen(false), []);
  const handleConfirmClearCache = useCallback(() => {
    setIsClearCacheConfirmOpen(false);
    void handleClearCache();
  }, [handleClearCache]);

  return {
    clearCacheConfirmDescription,
    isClearCacheConfirmOpen,
    handleOpenClearCacheConfirm,
    handleCancelClearCache,
    handleConfirmClearCache,
  };
};
