import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { t } from '@/shared/utils/i18n';
import { Button } from '@/shared/ui';
import { CloseIcon, SaveOutlinedIcon } from '@/shared/ui/icons';

const AUTHOR_NAME = 'XELZSSS';
const FOOTER_BUTTON_CLASS = 'inline-flex items-center justify-center';
const SAVE_BUTTON_CLASS = `${FOOTER_BUTTON_CLASS} gap-2`;
const HEADER_CLOSE_BUTTON_CLASS =
  ' bg-transparent p-0 text-[var(--ink-3)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-1)]';

type UpdaterStatus =
  import('@client/features/desktop-shell/infrastructure/updater/updaterClient').UpdaterStatus;
type PassiveUpdaterStatus = Exclude<UpdaterStatus['status'], 'available'>;
type ClearCacheStatus = 'pending' | 'success' | 'error' | null;

type SettingsModalHeaderProps = {
  modalTitleId: string;
  onClose: () => void;
};

type SettingsModalFooterProps = {
  onOpenAuthorPage: () => void;
  onClose: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  saveHint: string;
};

type ValidationSummaryProps = {
  issues: Array<{ tab: string; field?: string; message: string }>;
  overflowCount: number;
};

const FooterGhostButton = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <Button onClick={onClick} variant="ghost" size="sm" className={FOOTER_BUTTON_CLASS}>
    {children}
  </Button>
);

export const getUpdateStatusText = (updaterStatus: UpdaterStatus): string => {
  const passiveStatusTextMap: Record<PassiveUpdaterStatus, string> = {
    idle: '',
    checking: t('settings.update.status.checking'),
    'not-available': t('settings.update.status.latest'),
    error: '',
    disabled: t('settings.update.status.disabled'),
  };

  if (updaterStatus.status === 'available') {
    return updaterStatus.availableVersion
      ? `${t('settings.update.status.availableVersionPrefix')} v${updaterStatus.availableVersion}${t('settings.update.status.availableVersionSuffix')}`
      : t('settings.update.status.available');
  }

  if (updaterStatus.status === 'error') {
    return updaterStatus.error
      ? `${t('settings.update.status.failed')}: ${updaterStatus.error}`
      : t('settings.update.status.failed');
  }

  return passiveStatusTextMap[updaterStatus.status];
};

export const useClearCacheFeedback = () => {
  const [clearCacheNotice, setClearCacheNotice] = useState<string | null>(null);
  const [clearCacheStatus, setClearCacheStatus] = useState<ClearCacheStatus>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setClearCacheNotice(null);
      setClearCacheStatus(null);
      resetTimerRef.current = null;
    }, 2500);
  }, []);

  const setFeedback = useCallback(
    (notice: string, status: Exclude<ClearCacheStatus, null>) => {
      setClearCacheNotice(notice);
      setClearCacheStatus(status);
      if (status !== 'pending') {
        scheduleReset();
      }
    },
    [scheduleReset]
  );

  return {
    clearCacheNotice,
    clearCacheStatus,
    showClearCachePending: () => setFeedback(t('settings.clearCache.pending'), 'pending'),
    showClearCacheSuccess: (notice = t('settings.clearCache.success')) =>
      setFeedback(notice, 'success'),
    showClearCacheError: (notice?: string) =>
      setFeedback(notice ?? t('settings.clearCache.failed'), 'error'),
  };
};

export const SettingsModalHeader = ({ modalTitleId, onClose }: SettingsModalHeaderProps) => (
  <div className="flex items-center justify-between px-4 py-3">
    <h2
      id={modalTitleId}
      className="text-[13px] font-normal tracking-[-0.018em] text-[var(--ink-1)]"
    >
      {t('settings.modal.title')}
    </h2>
    <Button
      onClick={onClose}
      variant="ghost"
      size="icon"
      className={HEADER_CLOSE_BUTTON_CLASS}
      aria-label={t('settings.modal.cancel')}
    >
      <CloseIcon size={16} strokeWidth={2} />
    </Button>
  </div>
);

export const SettingsModalFooter = ({
  onOpenAuthorPage,
  onClose,
  onSave,
  saveDisabled,
  saveHint,
}: SettingsModalFooterProps) => (
  <div className="flex items-center justify-end gap-3 px-4 py-3">
    <div className="mr-auto text-[11px] tracking-[0.01em] text-[var(--ink-3)]">{saveHint}</div>
    <FooterGhostButton onClick={onOpenAuthorPage}>{AUTHOR_NAME}</FooterGhostButton>
    <FooterGhostButton onClick={onClose}>{t('settings.modal.cancel')}</FooterGhostButton>
    <Button
      onClick={onSave}
      variant="primary"
      size="sm"
      disabled={saveDisabled}
      title={saveDisabled ? saveHint : undefined}
      className={SAVE_BUTTON_CLASS}
    >
      <SaveOutlinedIcon size={14} strokeWidth={2} />
      {t('settings.modal.save')}
    </Button>
  </div>
);

export const SettingsValidationSummary = ({ issues, overflowCount }: ValidationSummaryProps) => (
  <div className="mx-4 border border-[var(--line-1)] border-l-[var(--status-error)] bg-[var(--bg-2)] px-3 py-2 text-xs text-[var(--ink-2)]">
    <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--status-error)]">
      {t('settings.validation.error.title')}
    </div>
    <div className="mt-2 space-y-1">
      {issues.map((issue) => (
        <div key={`${issue.tab}-${issue.field ?? 'tab'}-${issue.message}`}>{issue.message}</div>
      ))}
      {overflowCount > 0 ? (
        <div>{t('settings.validation.moreErrors').replace('{count}', String(overflowCount))}</div>
      ) : null}
    </div>
  </div>
);
