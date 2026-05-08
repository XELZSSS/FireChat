import { memo } from 'react';
import { t } from '@/shared/utils/i18n';

export const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="h-6 px-1 text-[13px] tracking-[0.01em] text-[var(--ink-3)]">
      {t('chat.requestingApiResponse')}
    </div>
  );
});
