import { useCallback, useMemo, type ReactNode } from 'react';
import { Button, Field } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import { SettingsCard } from '@client/features/settings/presentation/settingsModal/sections/formParts';
import type { OptionsTabProps } from '@client/features/settings/presentation/settingsModal/optionsTab/types';

type UpdateSettingsCardProps = Pick<
  OptionsTabProps,
  | 'appVersion'
  | 'updateStatusText'
  | 'updaterStatus'
  | 'mutationsLockedReason'
  | 'onCheckForUpdates'
  | 'onOpenUpdateDownload'
>;

const useVoidAsyncHandler = (action: () => Promise<void>) =>
  useCallback(() => {
    void action();
  }, [action]);

const UpdateSettingsCard = ({
  appVersion,
  updateStatusText,
  updaterStatus,
  mutationsLockedReason,
  onCheckForUpdates,
  onOpenUpdateDownload,
}: UpdateSettingsCardProps) => {
  const currentVersionLabel = useMemo(() => (appVersion ? `v${appVersion}` : '-'), [appVersion]);
  const updateActionsDisabled = updaterStatus === 'checking' || !!mutationsLockedReason;
  const interactionLockTitle = mutationsLockedReason ?? undefined;
  const handleCheckUpdates = useVoidAsyncHandler(onCheckForUpdates);
  const handleOpenDownload = useVoidAsyncHandler(onOpenUpdateDownload);

  return (
    <Field label={t('settings.version.title')}>
      <SettingsCard className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="text-xs font-medium text-[var(--ink-2)]">{currentVersionLabel}</div>
          {updateStatusText ? (
            <div className="text-xs text-[var(--ink-3)]">{updateStatusText}</div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleCheckUpdates}
            variant="ghost"
            size="sm"
            disabled={updateActionsDisabled}
            title={interactionLockTitle}
          >
            {t('settings.update.check')}
          </Button>
          {updaterStatus === 'available' && (
            <Button
              onClick={handleOpenDownload}
              variant="ghost"
              size="sm"
              disabled={updateActionsDisabled}
              title={interactionLockTitle}
            >
              {t('settings.update.download')}
            </Button>
          )}
        </div>
      </SettingsCard>
    </Field>
  );
};

export const NoticeBanner = ({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) => (
  <div className={` border bg-[var(--bg-2)] px-3 py-2 text-[11px] leading-5 ${className}`}>
    {children}
  </div>
);

export default UpdateSettingsCard;

