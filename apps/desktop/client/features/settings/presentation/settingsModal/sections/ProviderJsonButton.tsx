import { useState } from 'react';
import { Button, Modal } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import { textareaClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import {
  composeSettingsInputClassName,
  SettingsFieldMessages,
  SettingsHint,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';

type ProviderJsonButtonProps = {
  initialText: string;
  onApply: (value: string) => Promise<void> | void;
  disabled?: boolean;
};

export const ProviderJsonButton = ({
  initialText,
  onApply,
  disabled = false,
}: ProviderJsonButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(initialText);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setDraft(initialText);
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  const handleApply = async () => {
    try {
      await Promise.resolve(onApply(draft));
      setIsOpen(false);
      setError(null);
    } catch (applyError) {
      setError(
        applyError instanceof Error ? applyError.message : t('settings.providerJson.invalid')
      );
    }
  };

  return (
    <>
      <Button
        variant="subtle"
        size="md"
        className="min-w-[4rem] px-3 text-sm"
        onClick={handleOpen}
        disabled={disabled}
      >
        {t('settings.providerJson.button')}
      </Button>

      <Modal
        isOpen={isOpen}
        title={t('settings.providerJson.title')}
        className="z-[91] max-h-[min(44rem,calc(100vh-3rem))] max-w-[min(48rem,calc(100vw-3rem))] bg-[var(--bg-2)] shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
        overlayClassName="z-[90] bg-black/42"
        onClose={handleClose}
        ariaDescribedBy={false}
      >
        <div className="flex h-full flex-col">
          <div className="space-y-2 border-b border-[var(--line-1)] px-5 py-4">
            <div className="text-sm font-medium tracking-[0.01em] text-[var(--ink-1)]">
              {t('settings.providerJson.title')}
            </div>
            <SettingsHint>{t('settings.providerJson.help')}</SettingsHint>
          </div>
          <div className="flex-1 space-y-3 overflow-hidden px-5 py-4">
            <textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              rows={18}
              spellCheck={false}
              className={composeSettingsInputClassName(
                `${textareaClass} h-[min(24rem,calc(100vh-18rem))] font-mono text-xs`,
                error
                  ? [
                      {
                        severity: 'error',
                        tab: 'provider',
                        message: error,
                      },
                    ]
                  : undefined
              )}
            />
            {error ? (
              <SettingsFieldMessages
                issues={[
                  {
                    severity: 'error',
                    tab: 'provider',
                    message: error,
                  },
                ]}
              />
            ) : null}
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--line-1)] px-5 py-4">
            <Button variant="ghost" onClick={handleClose}>
              {t('settings.modal.cancel')}
            </Button>
            <Button variant="primary" onClick={() => void handleApply()}>
              {t('settings.providerJson.apply')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
