import { useMemo } from 'react';
import type { UpdaterStatus } from '@contracts/updater';
import type { ProviderSettingsMap } from '@client/features/settings/domain/settingsTypes';
import type { useAppSettings } from '@client/features/settings/application/useAppSettings';
import type { CustomProviderDraft } from '@/infrastructure/providers/runtime/providerFileMutations';
import type { Language, LanguagePreference } from '@/shared/utils/i18n';
import type { AccentPreference, Theme, ThemePreference } from '@/shared/utils/theme';

type AppSettingsState = ReturnType<typeof useAppSettings>;

type UseSettingsModalPropsOptions = {
  isSettingsOpen: boolean;
  providerSettings: ProviderSettingsMap;
  currentProviderId: keyof ProviderSettingsMap;
  language: Language;
  languagePreference: LanguagePreference;
  theme: Theme;
  themePreference: ThemePreference;
  accentPreference: AccentPreference;
  settingsInteractionLockReason: string | null;
  handleCloseSettings: () => void;
  handleSaveSettings: AppSettingsState['handleSaveSettings'];
  handleCreateCustomProvider: (draft: CustomProviderDraft) => Promise<string>;
  handleDeleteProvider: (providerId: keyof ProviderSettingsMap) => Promise<void>;
  appVersion: string;
  updaterStatus: UpdaterStatus;
};

export const useSettingsModalProps = ({
  isSettingsOpen,
  providerSettings,
  currentProviderId,
  language,
  languagePreference,
  theme,
  themePreference,
  accentPreference,
  settingsInteractionLockReason,
  handleCloseSettings,
  handleSaveSettings,
  handleCreateCustomProvider,
  handleDeleteProvider,
  appVersion,
  updaterStatus,
}: UseSettingsModalPropsOptions) => {
  return useMemo(
    () => ({
      isOpen: isSettingsOpen,
      onClose: handleCloseSettings,
      providerSettings,
      providerId: currentProviderId,
      language,
      languagePreference,
      theme,
      themePreference,
      accentPreference,
      interactionLockReason: settingsInteractionLockReason,
      onSave: handleSaveSettings,
      onCreateCustomProvider: handleCreateCustomProvider,
      onDeleteProvider: handleDeleteProvider,
      appVersion,
      updaterStatus,
    }),
    [
      appVersion,
      currentProviderId,
      handleCreateCustomProvider,
      handleCloseSettings,
      handleDeleteProvider,
      handleSaveSettings,
      isSettingsOpen,
      language,
      languagePreference,
      providerSettings,
      accentPreference,
      theme,
      themePreference,
      updaterStatus,
      settingsInteractionLockReason,
    ]
  );
};
