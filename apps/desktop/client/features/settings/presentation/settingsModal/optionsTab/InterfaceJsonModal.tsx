import { Button, Modal } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import {
  composeSettingsInputClassName,
  SettingsFieldMessages,
  SettingsHint,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import { JSON_MODAL_TEXTAREA_CLASS } from '@client/features/settings/presentation/settingsModal/optionsTab/constants';
import type { OptionsInteractionLock } from '@client/features/settings/presentation/settingsModal/optionsTab/types';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';

type InterfaceJsonModalProps = OptionsInteractionLock & {
  isOpen: boolean;
  draft: string;
  errorMessage: string | null;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

const buildInterfaceLayoutIssue = (message: string): SettingsValidationIssue => ({
  severity: 'error' as const,
  tab: 'options' as const,
  field: 'options.interfaceLayoutConfig',
  message,
});

const InterfaceJsonModal = ({
  isOpen,
  draft,
  errorMessage,
  isInteractionLocked,
  interactionLockTitle,
  onDraftChange,
  onClose,
  onSave,
}: InterfaceJsonModalProps) => {
  const errorIssues = errorMessage ? [buildInterfaceLayoutIssue(errorMessage)] : undefined;

  return (
    <Modal
      isOpen={isOpen}
      title={t('settings.options.interfaceJson.title')}
      className="z-[91] max-h-[min(44rem,calc(100vh-3rem))] max-w-[min(48rem,calc(100vw-3rem))] bg-[var(--bg-2)] shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
      overlayClassName="z-[90] bg-black/42"
      onClose={onClose}
      ariaDescribedBy={false}
    >
      <div className="flex h-full flex-col">
        <div className="space-y-2 border-b border-[var(--line-1)] px-5 py-4">
          <div className="text-sm font-medium tracking-[0.01em] text-[var(--ink-1)]">
            {t('settings.options.interfaceJson.title')}
          </div>
          <SettingsHint>{t('settings.options.interfaceJson.help')}</SettingsHint>
        </div>
        <div className="flex-1 space-y-3 overflow-hidden px-5 py-4">
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            rows={18}
            spellCheck={false}
            disabled={isInteractionLocked}
            aria-invalid={errorMessage ? true : undefined}
            className={composeSettingsInputClassName(JSON_MODAL_TEXTAREA_CLASS, errorIssues)}
          />
          {errorIssues ? <SettingsFieldMessages issues={errorIssues} /> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--line-1)] px-5 py-4">
          <Button variant="ghost" onClick={onClose}>
            {t('settings.modal.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            disabled={isInteractionLocked}
            title={interactionLockTitle}
          >
            {t('settings.options.interfaceJson.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InterfaceJsonModal;

