import { getDesktopInterfaceLayoutConfig } from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import { createRollbackStack } from '@client/features/settings/application/rollbackStack';
import { syncChatStateAfterSettingsMutation } from '@client/features/settings/application/saveSettings/applySettingsState';
import { createSaveSettingsTransactionContext } from '@client/features/settings/application/saveSettings/context';
import {
  saveAppSettingsStep,
  saveInterfaceLayoutStep,
  saveLocalProxyStep,
  saveProviderRuntimeStep,
  saveProviderSettingsStep,
  saveWindowBehaviorStep,
} from '@client/features/settings/application/saveSettings/steps';
import type { SaveSettingsTransactionOptions } from '@client/features/settings/application/saveSettings/types';
import { runSettingsTransaction } from '@settings-core/index';

export const saveSettingsTransaction = async ({
  value,
  chatService,
  providerSettings,
  hasMessages,
  syncDefaultProviderState,
  syncConversationState,
  ...appStateSetters
}: SaveSettingsTransactionOptions): Promise<void> => {
  const previousInterfaceLayoutConfig = await getDesktopInterfaceLayoutConfig();
  const context = await createSaveSettingsTransactionContext(
    value,
    providerSettings,
    previousInterfaceLayoutConfig
  );
  const rollbacks = createRollbackStack();
  let shouldReloadProviderCatalogOnFailure = false;

  await runSettingsTransaction(
    context,
    [
      {
        name: 'provider-runtime',
        run: async () => {
          shouldReloadProviderCatalogOnFailure = await saveProviderRuntimeStep(context, rollbacks);
        },
      },
      {
        name: 'provider-settings',
        run: () =>
          saveProviderSettingsStep({
            value,
            chatService,
            context,
            rollbacks,
          }),
      },
      {
        name: 'interface-layout',
        run: () => saveInterfaceLayoutStep(context, rollbacks),
      },
      {
        name: 'local-proxy',
        run: () => saveLocalProxyStep(value, context, rollbacks),
      },
      {
        name: 'window-behavior',
        run: () => saveWindowBehaviorStep(value, context, rollbacks),
      },
      {
        name: 'app-settings',
        run: () =>
          saveAppSettingsStep({
            value,
            context,
            rollbacks,
            appStateSetters,
          }),
      },
    ],
    async () => {
      await rollbacks.rollback();

      if (shouldReloadProviderCatalogOnFailure) {
        chatService.reloadProviderCatalog();
      }
    }
  );

  if (context.providerFileSnapshotChanged) {
    chatService.reloadProviderCatalog();
  }

  if (
    context.appSettingsChanged ||
    context.providerSettingsChanged ||
    context.providerFileSnapshotChanged
  ) {
    syncChatStateAfterSettingsMutation({
      chatService,
      hasMessages,
      nextDefaultProviderId: value.app.defaultProviderId,
      syncDefaultProviderState,
      syncConversationState,
    });
  }
};
