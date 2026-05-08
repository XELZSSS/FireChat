import type { ChatService } from '@client/features/chat/application/chatService';
import type { SaveSettingsPayload } from '@client/features/settings/domain/settingsTypes';
import type { ProviderId } from '@/shared/types/chat';
import type { ProviderSettings } from '@/infrastructure/providers/defaults';
import { persistAppSettingsAsync } from '@/infrastructure/persistence/appSettingsStore';
import {
  saveDesktopInterfaceLayoutConfig,
  syncDesktopCliProviderConfig,
  updateDesktopLocalProxyConfig,
  updateDesktopWindowBehavior,
} from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import { persistProviderRuntimeState } from '@/infrastructure/providers/runtime/providerRuntimeSync';
import { applyInterfaceLayoutConfigToDocument } from '@client/features/settings/infrastructure/interfaceLayoutConfig';
import { applyAppSettingsState } from '@client/features/settings/application/saveSettings/applySettingsState';
import type { SaveSettingsTransactionContext } from '@client/features/settings/application/saveSettings/context';
import type {
  AppPreferenceStateSetters,
  RollbackStack,
} from '@client/features/settings/application/saveSettings/types';

type ProviderSettingsMutation = {
  providerId: ProviderId;
  changed: boolean;
  nextSettings: ProviderSettings;
  previousSettings: ProviderSettings | undefined;
  rollbackLabel: string;
};

export const saveProviderRuntimeStep = async (
  context: SaveSettingsTransactionContext,
  rollbacks: RollbackStack
): Promise<boolean> => {
  if (!context.providerFileSnapshotChanged) {
    return false;
  }

  await persistProviderRuntimeState(context.nextProviderFileSnapshot);
  rollbacks.push('Failed to rollback provider runtime state after save error:', async () => {
    await persistProviderRuntimeState(context.previousProviderFileSnapshot);
  });
  return true;
};

export const saveProviderSettingsStep = ({
  value,
  chatService,
  context,
  rollbacks,
}: {
  value: SaveSettingsPayload;
  chatService: ChatService;
  context: SaveSettingsTransactionContext;
  rollbacks: RollbackStack;
}): void => {
  const mutations: ProviderSettingsMutation[] = [
    {
      providerId: value.providerId,
      changed: context.providerSettingsChanged,
      nextSettings: value.providerSettings,
      previousSettings: context.previousProviderSettings,
      rollbackLabel: 'Failed to rollback provider settings after save error:',
    },
  ];

  mutations.forEach(({ providerId, changed, nextSettings, previousSettings, rollbackLabel }) => {
    if (!changed) {
      return;
    }

    chatService.updateProviderSettings(providerId, nextSettings);

    if (previousSettings) {
      rollbacks.push(rollbackLabel, () => {
        chatService.updateProviderSettings(providerId, previousSettings);
      });
    }
  });
};

export const saveInterfaceLayoutStep = async (
  context: SaveSettingsTransactionContext,
  rollbacks: RollbackStack
): Promise<void> => {
  if (!context.interfaceLayoutChanged) {
    return;
  }

  await saveDesktopInterfaceLayoutConfig(context.nextInterfaceLayoutConfig);
  applyInterfaceLayoutConfigToDocument(context.nextInterfaceLayoutConfig);
  rollbacks.push('Failed to rollback interface layout config after save error:', async () => {
    await saveDesktopInterfaceLayoutConfig(context.previousInterfaceLayoutConfig);
    applyInterfaceLayoutConfigToDocument(context.previousInterfaceLayoutConfig);
  });
};

export const saveLocalProxyStep = async (
  value: SaveSettingsPayload,
  context: SaveSettingsTransactionContext,
  rollbacks: RollbackStack
): Promise<void> => {
  if (!context.proxyChanged) {
    return;
  }

  await updateDesktopLocalProxyConfig({
    host: value.app.localProxyHost,
    port: value.app.localProxyPort,
  });
  rollbacks.push('Failed to rollback local proxy config after save error:', async () => {
    await updateDesktopLocalProxyConfig({
      host: context.previousAppSettings.localProxyHost,
      port: context.previousAppSettings.localProxyPort,
    });
  });
};

export const saveWindowBehaviorStep = async (
  value: SaveSettingsPayload,
  context: SaveSettingsTransactionContext,
  rollbacks: RollbackStack
): Promise<void> => {
  if (!context.windowBehaviorChanged) {
    return;
  }

  await updateDesktopWindowBehavior({
    closeToTray: value.app.closeToTray,
    minimizeToTray: value.app.minimizeToTray,
    launchAtStartup: value.app.launchAtStartup,
    startMinimizedToTray: value.app.startMinimizedToTray,
    rememberWindowBounds: value.app.rememberWindowBounds,
  });
  rollbacks.push('Failed to rollback window behavior after save error:', async () => {
    await updateDesktopWindowBehavior({
      closeToTray: context.previousAppSettings.closeToTray,
      minimizeToTray: context.previousAppSettings.minimizeToTray,
      launchAtStartup: context.previousAppSettings.launchAtStartup,
      startMinimizedToTray: context.previousAppSettings.startMinimizedToTray,
      rememberWindowBounds: context.previousAppSettings.rememberWindowBounds,
    });
  });
};

export const syncCliProviderStep = async (
  value: SaveSettingsPayload,
  context: SaveSettingsTransactionContext
): Promise<void> => {
  if (!context.cliChanged) {
    return;
  }

  await syncDesktopCliProviderConfig(value.app.cli);
};

export const saveAppSettingsStep = async ({
  value,
  context,
  rollbacks,
  appStateSetters,
}: {
  value: SaveSettingsPayload;
  context: SaveSettingsTransactionContext;
  rollbacks: RollbackStack;
  appStateSetters: AppPreferenceStateSetters;
}): Promise<void> => {
  if (!context.appSettingsChanged) {
    return;
  }

  await persistAppSettingsAsync(value.app);
  applyAppSettingsState(value.app, appStateSetters);
  rollbacks.push('Failed to rollback app settings after save error:', async () => {
    await persistAppSettingsAsync(context.previousAppSettings);
    applyAppSettingsState(context.previousAppSettings, appStateSetters);
  });
};
