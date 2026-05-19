import { t } from '@/shared/utils/i18n';
import { getProviderUiMetaForId } from '@/infrastructure/providers/config/providerConfig';
import { Button } from '@/shared/ui';
import type { DefaultProviderCardProps } from '@client/features/settings/presentation/settingsModal/sections/providerTab.types';

export const DefaultProviderCard = ({
  providerId,
  currentChatProviderId,
  defaultProviderId,
  providerOptions,
  mutationsLockedReason,
  onSetDefaultProvider,
}: DefaultProviderCardProps) => {
  const resolveProviderLabel = (targetProviderId: string) =>
    providerOptions.find((option) => option.value === targetProviderId)?.label ??
    getProviderUiMetaForId(targetProviderId)?.label ??
    targetProviderId;

  const isCurrentChatProvider = providerId === currentChatProviderId;
  const isDefaultProvider = providerId === defaultProviderId;
  const currentChatProviderLabel = resolveProviderLabel(currentChatProviderId);
  const currentDefaultProviderLabel = resolveProviderLabel(defaultProviderId);

  return (
    <div className="border border-[var(--line-1)] bg-[var(--bg-2)]/60 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-medium text-[var(--ink-1)]">
            {isCurrentChatProvider
              ? t('settings.modal.defaultProvider.currentChatTitle')
              : t('settings.modal.defaultProvider.editingTitle')}
          </div>
          <div className="text-xs leading-5 text-[var(--ink-3)]">
            {isCurrentChatProvider
              ? t('settings.modal.defaultProvider.currentHint')
              : t('settings.modal.defaultProvider.editingHint')}
          </div>
          {!isCurrentChatProvider ? (
            <div className="text-xs text-[var(--ink-2)]">
              {t('settings.modal.defaultProvider.currentChatLabel')}: {currentChatProviderLabel}
            </div>
          ) : null}
          {!isDefaultProvider ? (
            <div className="text-xs text-[var(--ink-2)]">
              {t('settings.modal.defaultProvider.current')}: {currentDefaultProviderLabel}
            </div>
          ) : null}
        </div>

        {!isDefaultProvider ? (
          <Button
            onClick={onSetDefaultProvider}
            variant="subtle"
            size="sm"
            disabled={Boolean(mutationsLockedReason)}
          >
            {t('settings.modal.defaultProvider.makeCurrent')}
          </Button>
        ) : null}
      </div>
    </div>
  );
};
