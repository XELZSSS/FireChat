import type { UpdaterStatus } from '@contracts/updater';
import type { AccentPreference } from '@/shared/utils/theme';
import type { SettingsControllerValue } from '@client/features/settings/presentation/settingsModal/services/useSettingsController';

export type SettingsTabContentBuildContext = {
  controller: SettingsControllerValue;
  activeMeta: SettingsControllerValue['activeMeta'];
  accentPreference: AccentPreference;
  appVersion: string;
  updaterStatus: UpdaterStatus;
  updateStatusText: string;
  interactionLockReason: string | null;
  clearCacheNotice: string | null;
  clearCacheStatus: 'pending' | 'success' | 'error' | null;
  onCheckForUpdates: () => Promise<void>;
  onOpenUpdateDownload: () => Promise<void>;
  onOpenClearCache: () => void;
};

