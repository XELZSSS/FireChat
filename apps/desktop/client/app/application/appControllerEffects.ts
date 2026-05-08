import { useEffect } from 'react';
import type { UpdaterStatus } from '@contracts/updater';
import { t, applyLanguageToDocument, type Language } from '@/shared/utils/i18n';
import {
  applyThemeToDocument,
  type AccentPreference,
  type Theme,
  type ThemePreference,
} from '@/shared/utils/theme';
import {
  getUpdaterStatus,
  subscribeUpdaterStatus,
} from '@client/features/desktop-shell/infrastructure/updater/updaterClient';
import { writeAppStorage } from '@/infrastructure/persistence/storageKeys';
import { loadAppSettings } from '@/infrastructure/persistence/appSettingsStore';
import {
  getDesktopAppVersion,
  syncDesktopCliProviderConfig,
  syncDesktopLocalProxyConfig,
  updateDesktopWindowBehavior,
  updateDesktopStartupAppearance,
} from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import { applyAppOptionsToDocument, type AppFontSize } from '@/shared/utils/appOptions';
import {
  applyInterfaceLayoutConfigToDocument,
  readBootstrappedInterfaceLayoutConfig,
} from '@client/features/settings/infrastructure/interfaceLayoutConfig';

export const useDocumentAppearance = (
  language: Language,
  themePreference: ThemePreference,
  theme: Theme,
  accentPreference: AccentPreference
) => {
  useEffect(() => {
    applyLanguageToDocument();
    document.title = t('app.title');
  }, [language]);

  useEffect(() => {
    applyThemeToDocument();
    void updateDesktopStartupAppearance({
      themePreference,
      theme,
      accentPreference,
    }).catch((error) => {
      console.error('Failed to sync startup appearance to desktop runtime:', error);
    });
  }, [accentPreference, theme, themePreference]);
};

export const useAppMetadataSync = ({
  setAppVersion,
  setUpdaterStatus,
}: {
  setAppVersion: (version: string) => void;
  setUpdaterStatus: (status: UpdaterStatus) => void;
}) => {
  useEffect(() => {
    let active = true;

    const syncUpdaterStatus = (status: UpdaterStatus) => {
      if (!active) return;
      setUpdaterStatus(status);
      writeAppStorage('updaterStatus', JSON.stringify(status));
    };

    void getUpdaterStatus().then((status) => {
      syncUpdaterStatus(status);
    });

    void getDesktopAppVersion().then((version) => {
      if (!active || !version) return;
      setAppVersion(version);
      writeAppStorage('appVersion', version);
    });

    const unsubscribe = subscribeUpdaterStatus((status) => {
      syncUpdaterStatus(status);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [setAppVersion, setUpdaterStatus]);
};

export const useDocumentAppOptions = ({
  uiFontFamily,
  uiFontSize,
  reduceMotion,
}: {
  uiFontFamily: string;
  uiFontSize: AppFontSize;
  reduceMotion: boolean;
}) => {
  useEffect(() => {
    applyAppOptionsToDocument({
      uiFontFamily,
      uiFontSize,
      reduceMotion,
    });
  }, [reduceMotion, uiFontFamily, uiFontSize]);

  useEffect(() => {
    applyInterfaceLayoutConfigToDocument(readBootstrappedInterfaceLayoutConfig());
  }, []);
};

export const useTrayLanguageSync = (
  language: Language,
  syncTrayLabels: (language: Language) => void
) => {
  useEffect(() => {
    syncTrayLabels(language);
  }, [language, syncTrayLabels]);
};

export const useLocalProxyConfigSync = () => {
  useEffect(() => {
    const { localProxyHost, localProxyPort } = loadAppSettings();
    void syncDesktopLocalProxyConfig({
      host: localProxyHost,
      port: localProxyPort,
    }).catch((error) => {
      console.error('Failed to sync local proxy config to desktop runtime:', error);
    });
  }, []);
};

export const useCliProviderConfigSync = () => {
  useEffect(() => {
    const { cli } = loadAppSettings();
    void syncDesktopCliProviderConfig(cli).catch((error) => {
      console.error('Failed to sync CLI provider config to desktop runtime:', error);
    });
  }, []);
};

export const useWindowBehaviorSync = ({
  closeToTray,
  minimizeToTray,
  launchAtStartup,
  startMinimizedToTray,
  rememberWindowBounds,
}: {
  closeToTray: boolean;
  minimizeToTray: boolean;
  launchAtStartup: boolean;
  startMinimizedToTray: boolean;
  rememberWindowBounds: boolean;
}) => {
  useEffect(() => {
    void updateDesktopWindowBehavior({
      closeToTray,
      minimizeToTray,
      launchAtStartup,
      startMinimizedToTray,
      rememberWindowBounds,
    }).catch((error) => {
      console.error('Failed to sync window behavior to desktop runtime:', error);
    });
  }, [closeToTray, launchAtStartup, minimizeToTray, rememberWindowBounds, startMinimizedToTray]);
};
