import { useId } from 'react';
import type { UpdaterStatus } from '@contracts/updater';
import { ProviderId } from '@/shared/types/chat';
import { t, type Language, type LanguagePreference } from '@/shared/utils/i18n';
import type { AccentPreference, Theme, ThemePreference } from '@/shared/utils/theme';
import type { CustomProviderDraft } from '@/infrastructure/providers/runtime/providerFileMutations';
import { useSettingsController } from '@client/features/settings/presentation/settingsModal/services/useSettingsController';
import type {
  ProviderSettingsMap,
  SaveSettingsPayload,
} from '@client/features/settings/domain/settingsTypes';
import { ConfirmDialog, Modal, Tabs } from '@/shared/ui';
import {
  SettingsModalFooter,
  SettingsModalHeader,
  SettingsValidationSummary,
} from '@client/features/settings/presentation/settingsModal/sections/SettingsModalParts';
import { SettingsModalTabContent } from '@client/features/settings/presentation/settingsModal/tabs/SettingsModalTabContent';
import { useSettingsModalServices } from '@client/features/settings/presentation/settingsModal/services/useSettingsModalServices';
import { useSettingsModalViewState } from '@client/features/settings/presentation/settingsModal/services/useSettingsModalViewState';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerSettings: ProviderSettingsMap;
  providerId: ProviderId;
  language: Language;
  languagePreference: LanguagePreference;
  theme: Theme;
  themePreference: ThemePreference;
  accentPreference: AccentPreference;
  onSave: (value: SaveSettingsPayload) => void | Promise<void>;
  onCreateCustomProvider: (draft: CustomProviderDraft) => Promise<string>;
  onDeleteProvider: (providerId: ProviderId) => Promise<void>;
  appVersion: string;
  updaterStatus: UpdaterStatus;
  interactionLockReason?: string | null;
}

type OpenSettingsModalProps = Omit<SettingsModalProps, 'isOpen'>;

const OpenSettingsModal = ({
  onClose,
  providerSettings,
  providerId,
  language,
  languagePreference,
  theme,
  themePreference,
  accentPreference,
  onSave,
  onCreateCustomProvider,
  onDeleteProvider,
  appVersion,
  updaterStatus,
  interactionLockReason = null,
}: OpenSettingsModalProps) => {
  const modalTitleId = useId();
  const tabsIdPrefix = useId();
  const controller = useSettingsController({
    onClose,
    onSave,
    providerSettings,
    providerId,
    language,
    languagePreference,
    themePreference,
    accentPreference,
    onCreateCustomProvider,
    onDeleteProvider,
    saveBlockedReason: interactionLockReason,
  });

  const {
    state,
    tabs,
    activeMeta,
    validation,
    isDirty,
    handleSave,
    requestClose,
    showDiscardChangesPrompt,
    confirmDiscardChanges,
    cancelDiscardChanges,
    showValidationSummary,
    onTabChange,
  } = controller;
  const { app, ui } = state;
  const { saveDisabled, saveHint, validationSummary, validationOverflowCount } =
    useSettingsModalViewState({
      validation,
      isDirty,
      interactionLockReason,
    });
  const {
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
  } = useSettingsModalServices({
    updaterStatus,
    interactionLockReason,
  });

  return (
    <>
      <Modal
        isOpen
        title={t('settings.modal.title')}
        className="settings-modal-root h-[calc(100vh-1.5rem)] max-h-[calc(100vh-1.5rem)] max-w-[min(82rem,calc(100vw-1.5rem))]"
        onClose={requestClose}
        ariaDescribedBy={false}
      >
        <div className="flex h-full w-full flex-col">
          <SettingsModalHeader modalTitleId={modalTitleId} onClose={requestClose} />
          {showValidationSummary && validationSummary.length > 0 ? (
            <SettingsValidationSummary
              issues={validationSummary}
              overflowCount={validationOverflowCount}
            />
          ) : null}
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden px-4 py-3">
            <Tabs
              items={tabs}
              activeId={ui.activeTab}
              onChange={onTabChange}
              idPrefix={tabsIdPrefix}
              className="border-0 pr-2"
            />
            <div
              className="settings-modal-scroll-panel settings-modal-scrollbar-hide min-h-0 min-w-0 flex-1 overflow-y-auto pl-4 pr-5 pt-1"
              role="tabpanel"
              id={`${tabsIdPrefix}-panel-${ui.activeTab}`}
              aria-labelledby={`${tabsIdPrefix}-tab-${ui.activeTab}`}
            >
              <div>
                <SettingsModalTabContent
                  controller={controller}
                  activeMeta={activeMeta}
                  accentPreference={app.accentPreference}
                  appVersion={appVersion}
                  updaterStatus={updaterStatus}
                  updateStatusText={updateStatusText}
                  interactionLockReason={interactionLockReason}
                  clearCacheNotice={clearCacheNotice}
                  clearCacheStatus={clearCacheStatus}
                  onCheckForUpdates={handleCheckForUpdates}
                  onOpenUpdateDownload={handleOpenUpdateDownload}
                  onOpenClearCache={handleOpenClearCacheConfirm}
                />
              </div>
            </div>
          </div>
          <SettingsModalFooter
            onOpenAuthorPage={handleOpenAuthorPage}
            onClose={requestClose}
            onSave={handleSave}
            saveDisabled={saveDisabled}
            saveHint={saveHint}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDiscardChangesPrompt}
        overlayClassName="z-[80]"
        title={t('settings.modal.unsaved.title')}
        description={t('settings.modal.unsaved.description')}
        confirmLabel={t('settings.modal.unsaved.confirm')}
        cancelLabel={t('settings.modal.cancel')}
        onConfirm={confirmDiscardChanges}
        onCancel={cancelDiscardChanges}
      />

      <ConfirmDialog
        isOpen={isClearCacheConfirmOpen}
        overlayClassName="z-[80]"
        title={t('settings.clearCache.cardTitle')}
        description={clearCacheConfirmDescription}
        confirmLabel={t('settings.clearCache.confirmAction')}
        cancelLabel={t('settings.modal.cancel')}
        onConfirm={handleConfirmClearCache}
        onCancel={handleCancelClearCache}
        danger
      />
    </>
  );
};

export default function SettingsModal({ isOpen, ...props }: SettingsModalProps) {
  if (!isOpen) {
    return null;
  }

  return <OpenSettingsModal {...props} />;
}

