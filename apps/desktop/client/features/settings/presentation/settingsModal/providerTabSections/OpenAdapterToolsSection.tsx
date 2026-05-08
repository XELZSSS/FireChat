import { useState } from 'react';
import { t } from '@/shared/utils/i18n';
import {
  OPENADAPTER_TOOL_DEFINITIONS,
  type OpenAdapterToolKey,
} from '@/infrastructure/providers/openadapterToolConfig';
import { Button } from '@/shared/ui';
import {
  SettingsCard,
  SettingsToggleRow,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import OpenAdapterToolGuideDialog from '@client/features/settings/presentation/settingsModal/sections/OpenAdapterToolGuideDialog';
import type { OpenAdapterToolsSectionProps } from '@client/features/settings/presentation/settingsModal/sections/providerTab.types';

export const OpenAdapterToolsSection = ({
  openAdapterTools,
  mutationsLockedReason,
  onSetOpenAdapterToolEnabled,
}: OpenAdapterToolsSectionProps) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <SettingsCard>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold tracking-[0.01em] text-[var(--ink-1)]">
            {t('settings.modal.openadapterTools.title')}
          </div>
          <Button variant="subtle" size="sm" onClick={() => setIsGuideOpen(true)}>
            {t('settings.modal.openadapterTools.guide.button')}
          </Button>
        </div>
        <div className="space-y-1.5">
          {OPENADAPTER_TOOL_DEFINITIONS.map((definition) => (
            <SettingsToggleRow
              key={definition.key}
              checked={openAdapterTools[definition.key as OpenAdapterToolKey]}
              title={t(definition.labelKey)}
              description={t(definition.descriptionKey)}
              disabled={Boolean(mutationsLockedReason)}
              onCheckedChange={(checked) =>
                onSetOpenAdapterToolEnabled(definition.key as OpenAdapterToolKey, checked)
              }
            />
          ))}
        </div>
      </div>
      <OpenAdapterToolGuideDialog isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </SettingsCard>
  );
};

