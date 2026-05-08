import { useState } from 'react';
import InterfaceSettingsCard from '@client/features/settings/presentation/settingsModal/optionsTab/InterfaceSettingsCard';
import MessageSettingsCard from '@client/features/settings/presentation/settingsModal/optionsTab/MessageSettingsCard';
import WindowSettingsCard from '@client/features/settings/presentation/settingsModal/optionsTab/WindowSettingsCard';
import LocalProxySettingsCard from '@client/features/settings/presentation/settingsModal/optionsTab/LocalProxySettingsCard';
import UpdateSettingsCard from '@client/features/settings/presentation/settingsModal/optionsTab/UpdateSettingsCard';
import DataSettingsCard from '@client/features/settings/presentation/settingsModal/optionsTab/DataSettingsCard';
import type { OptionsTabProps } from '@client/features/settings/presentation/settingsModal/optionsTab/types';
import {
  exportDesktopOptionsConfig,
  importDesktopOptionsConfig,
  openDesktopConfigDirectory,
} from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import { t } from '@/shared/utils/i18n';
import { parseInterfaceLayoutConfigText } from '@client/features/settings/infrastructure/interfaceLayoutConfig';

const OptionsTab = ({
  languagePreference,
  themePreference,
  accentPreference,
  uiFontFamily,
  uiFontSize,
  interfaceLayoutConfigText,
  sendShortcut,
  showMessageTimestamps,
  wrapCodeBlocks,
  reduceMotion,
  sidebarCollapsed,
  closeToTray,
  minimizeToTray,
  launchAtStartup,
  startMinimizedToTray,
  rememberWindowBounds,
  appVersion,
  httpProtocol,
  localProxyHost,
  localProxyPort,
  aiGateway,
  updateStatusText,
  updaterStatus,
  mutationsLockedReason = null,
  validationIssuesByField,
  clearCacheNotice,
  clearCacheStatus,
  onAccentPreferenceChange,
  onUiFontFamilyChange,
  onUiFontSizeChange,
  onInterfaceLayoutConfigTextChange,
  onSendShortcutChange,
  onToggleShowMessageTimestamps,
  onToggleWrapCodeBlocks,
  onToggleReduceMotion,
  onToggleSidebarCollapsed,
  onToggleCloseToTray,
  onToggleMinimizeToTray,
  onToggleLaunchAtStartup,
  onToggleStartMinimizedToTray,
  onToggleRememberWindowBounds,
  onResetOptions,
  onImportOptions,
  onCheckForUpdates,
  onOpenUpdateDownload,
  onOpenClearCache,
  onHttpProtocolChange,
  onLocalProxyHostChange,
  onLocalProxyPortChange,
}: OptionsTabProps) => {
  const [optionsNotice, setOptionsNotice] = useState('');
  const [optionsNoticeStatus, setOptionsNoticeStatus] = useState<'success' | 'error' | null>(null);
  const isInteractionLocked = Boolean(mutationsLockedReason);
  const interactionLockTitle = mutationsLockedReason ?? undefined;

  const setNotice = (message: string, status: 'success' | 'error') => {
    setOptionsNotice(message);
    setOptionsNoticeStatus(status);
  };

  const handleOpenConfigDirectory = () => {
    void openDesktopConfigDirectory().catch((error) => {
      setNotice(error instanceof Error ? error.message : String(error), 'error');
    });
  };

  const handleExportOptions = () => {
    try {
      const exportPayload = {
        schemaVersion: 1,
        app: {
          languagePreference,
          themePreference,
          accentPreference,
          uiFontFamily,
          uiFontSize,
          sendShortcut,
          showMessageTimestamps,
          wrapCodeBlocks,
          reduceMotion,
          sidebarCollapsed,
          closeToTray,
          minimizeToTray,
          launchAtStartup,
          startMinimizedToTray,
          rememberWindowBounds,
          httpProtocol,
          localProxyHost,
          localProxyPort,
          aiGateway,
        },
        interfaceLayout: parseInterfaceLayoutConfigText(interfaceLayoutConfigText),
      };

      void exportDesktopOptionsConfig(exportPayload)
        .then((result) => {
          if (!result.canceled) {
            setNotice(t('settings.options.exported'), 'success');
          }
        })
        .catch((error) => {
          setNotice(error instanceof Error ? error.message : String(error), 'error');
        });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error), 'error');
    }
  };

  const handleImportOptions = () => {
    void importDesktopOptionsConfig()
      .then((result) => {
        if (result.canceled) {
          return;
        }

        onImportOptions(result.value);
        setNotice(t('settings.options.imported'), 'success');
      })
      .catch((error) => {
        setNotice(error instanceof Error ? error.message : String(error), 'error');
      });
  };

  const handleResetOptions = () => {
    onResetOptions();
    setNotice(t('settings.options.resetDone'), 'success');
  };

  return (
    <div className="space-y-3">
      <InterfaceSettingsCard
        accentPreference={accentPreference}
        uiFontFamily={uiFontFamily}
        uiFontSize={uiFontSize}
        interfaceLayoutConfigText={interfaceLayoutConfigText}
        reduceMotion={reduceMotion}
        sidebarCollapsed={sidebarCollapsed}
        validationIssuesByField={validationIssuesByField}
        isInteractionLocked={isInteractionLocked}
        interactionLockTitle={interactionLockTitle}
        onAccentPreferenceChange={onAccentPreferenceChange}
        onUiFontFamilyChange={onUiFontFamilyChange}
        onUiFontSizeChange={onUiFontSizeChange}
        onInterfaceLayoutConfigTextChange={onInterfaceLayoutConfigTextChange}
        onToggleReduceMotion={onToggleReduceMotion}
        onToggleSidebarCollapsed={onToggleSidebarCollapsed}
      />

      <MessageSettingsCard
        sendShortcut={sendShortcut}
        showMessageTimestamps={showMessageTimestamps}
        wrapCodeBlocks={wrapCodeBlocks}
        isInteractionLocked={isInteractionLocked}
        interactionLockTitle={interactionLockTitle}
        onSendShortcutChange={onSendShortcutChange}
        onToggleShowMessageTimestamps={onToggleShowMessageTimestamps}
        onToggleWrapCodeBlocks={onToggleWrapCodeBlocks}
      />

      <WindowSettingsCard
        closeToTray={closeToTray}
        minimizeToTray={minimizeToTray}
        launchAtStartup={launchAtStartup}
        startMinimizedToTray={startMinimizedToTray}
        rememberWindowBounds={rememberWindowBounds}
        isInteractionLocked={isInteractionLocked}
        interactionLockTitle={interactionLockTitle}
        onToggleCloseToTray={onToggleCloseToTray}
        onToggleMinimizeToTray={onToggleMinimizeToTray}
        onToggleLaunchAtStartup={onToggleLaunchAtStartup}
        onToggleStartMinimizedToTray={onToggleStartMinimizedToTray}
        onToggleRememberWindowBounds={onToggleRememberWindowBounds}
      />

      <LocalProxySettingsCard
        localProxyHost={localProxyHost}
        localProxyPort={localProxyPort}
        httpProtocol={httpProtocol}
        mutationsLockedReason={mutationsLockedReason}
        validationIssuesByField={validationIssuesByField}
        onHttpProtocolChange={onHttpProtocolChange}
        onLocalProxyHostChange={onLocalProxyHostChange}
        onLocalProxyPortChange={onLocalProxyPortChange}
      />

      <DataSettingsCard
        mutationsLockedReason={mutationsLockedReason}
        clearCacheNotice={clearCacheNotice}
        clearCacheStatus={clearCacheStatus}
        optionsNotice={optionsNotice}
        optionsNoticeStatus={optionsNoticeStatus}
        onOpenConfigDirectory={handleOpenConfigDirectory}
        onExportOptions={handleExportOptions}
        onImportOptions={handleImportOptions}
        onResetOptions={handleResetOptions}
        onOpenClearCache={onOpenClearCache}
      />

      <UpdateSettingsCard
        appVersion={appVersion}
        updateStatusText={updateStatusText}
        updaterStatus={updaterStatus}
        mutationsLockedReason={mutationsLockedReason}
        onCheckForUpdates={onCheckForUpdates}
        onOpenUpdateDownload={onOpenUpdateDownload}
      />
    </div>
  );
};

export default OptionsTab;
