import { Button } from '@/shared/ui';
import { AddIcon } from '@/shared/ui/icons';
import { t } from '@/shared/utils/i18n';
import { SIDEBAR_MATCHED_TEXT_CLASS } from '@client/features/sessions/presentation/sidebarHelpers';

export function SidebarHeader({
  collapsed,
  sessionActionsDisabled,
  sessionActionsDisabledReason,
  onNewChatClick,
}: {
  collapsed: boolean;
  sessionActionsDisabled: boolean;
  sessionActionsDisabledReason: string | null;
  onNewChatClick: () => void;
}) {
  return (
    <div className={`w-full ${collapsed ? 'mb-2 flex flex-col items-center gap-2' : 'mb-4'}`}>
      {collapsed ? (
        <Button
          onClick={onNewChatClick}
          variant="primary"
          size="icon"
          disabled={sessionActionsDisabled}
          aria-label={t('sidebar.newChat')}
          title={
            sessionActionsDisabled
              ? (sessionActionsDisabledReason ?? t('sidebar.newChat'))
              : t('sidebar.newChat')
          }
          className="h-9 w-9 transform-none text-[var(--text-on-accent)] hover:text-[var(--text-on-accent)] active:scale-100"
        >
          <AddIcon size={16} strokeWidth={2} />
        </Button>
      ) : (
        <Button
          onClick={onNewChatClick}
          variant="primary"
          size="md"
          disabled={sessionActionsDisabled}
          title={sessionActionsDisabled ? (sessionActionsDisabledReason ?? undefined) : undefined}
          className="mt-3 flex h-10 w-full transform-none items-center justify-center gap-2 text-[var(--text-on-accent)] hover:text-[var(--text-on-accent)] active:scale-100"
        >
          <AddIcon size={16} strokeWidth={2} />
          <span className={SIDEBAR_MATCHED_TEXT_CLASS}>{t('sidebar.newChat')}</span>
        </Button>
      )}
    </div>
  );
}
