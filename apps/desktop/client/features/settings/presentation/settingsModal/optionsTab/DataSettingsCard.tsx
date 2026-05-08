import { Button, Field } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import { SettingsCard } from '@client/features/settings/presentation/settingsModal/sections/formParts';
import { NoticeBanner } from '@client/features/settings/presentation/settingsModal/optionsTab/UpdateSettingsCard';
import type { OptionsTabProps } from '@client/features/settings/presentation/settingsModal/optionsTab/types';

type DataSettingsCardProps = Pick<
  OptionsTabProps,
  'mutationsLockedReason' | 'clearCacheNotice' | 'clearCacheStatus' | 'onOpenClearCache'
> & {
  optionsNotice: string;
  optionsNoticeStatus: 'success' | 'error' | null;
  onOpenConfigDirectory: () => void;
  onExportOptions: () => void;
  onImportOptions: () => void;
  onResetOptions: () => void;
};

const NOTICE_CLASS_BY_STATUS = {
  default: 'border-[var(--line-1)] bg-[var(--bg-2)] text-[var(--ink-2)]',
  success:
    'border-[var(--line-1)] border-l-[var(--status-success)] bg-[var(--bg-2)] text-[var(--ink-2)]',
  error:
    'border-[var(--line-1)] border-l-[var(--status-error)] bg-[var(--bg-2)] text-[var(--ink-2)]',
} as const;

const DESTRUCTIVE_GHOST_BUTTON_CLASS =
  'text-[var(--status-error)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-1)]';

const DataSettingsCard = ({
  mutationsLockedReason,
  clearCacheNotice,
  clearCacheStatus,
  optionsNotice,
  optionsNoticeStatus,
  onOpenConfigDirectory,
  onExportOptions,
  onImportOptions,
  onResetOptions,
  onOpenClearCache,
}: DataSettingsCardProps) => {
  const isClearingData = clearCacheStatus === 'pending';
  const disabled = !!mutationsLockedReason || isClearingData;
  const interactionLockTitle = mutationsLockedReason ?? undefined;
  const clearCacheNoticeClass =
    clearCacheStatus === 'pending'
      ? NOTICE_CLASS_BY_STATUS.default
      : clearCacheStatus === 'success'
      ? NOTICE_CLASS_BY_STATUS.success
      : clearCacheStatus === 'error'
        ? NOTICE_CLASS_BY_STATUS.error
        : NOTICE_CLASS_BY_STATUS.default;
  const optionsNoticeClass =
    optionsNoticeStatus === 'success'
      ? NOTICE_CLASS_BY_STATUS.success
      : optionsNoticeStatus === 'error'
        ? NOTICE_CLASS_BY_STATUS.error
        : NOTICE_CLASS_BY_STATUS.default;

  return (
    <Field label={t('settings.clearCache.title')}>
      <SettingsCard className="space-y-2">
        <p className="text-xs leading-5 text-[var(--ink-3)]">
          {t('settings.clearCache.description')}
        </p>
        {optionsNotice ? (
          <NoticeBanner className={optionsNoticeClass}>{optionsNotice}</NoticeBanner>
        ) : null}
        {clearCacheNotice ? (
          <NoticeBanner className={clearCacheNoticeClass}>{clearCacheNotice}</NoticeBanner>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenConfigDirectory}
            disabled={disabled}
            title={interactionLockTitle}
          >
            {t('settings.options.openConfigDirectory')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportOptions}
            disabled={disabled}
            title={interactionLockTitle}
          >
            {t('settings.options.export')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onImportOptions}
            disabled={disabled}
            title={interactionLockTitle}
          >
            {t('settings.options.import')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetOptions}
            disabled={disabled}
            title={interactionLockTitle}
          >
            {t('settings.options.reset')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenClearCache}
            disabled={disabled}
            title={interactionLockTitle}
            className={DESTRUCTIVE_GHOST_BUTTON_CLASS}
          >
            {isClearingData ? t('settings.clearCache.pending') : t('settings.clearCache.button')}
          </Button>
        </div>
      </SettingsCard>
    </Field>
  );
};

export default DataSettingsCard;

