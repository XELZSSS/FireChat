import { Field } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import type {
  ImageGenerationCapabilities,
  ImageGenerationSettings,
} from '@/infrastructure/providers/imageGenerationSettings';
import {
  SettingsCard,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import type { ImageGenerationOption } from '@client/features/settings/presentation/settingsModal/sections/imageGenerationOptions';
import {
  NumberSetting,
  ToggleSetting,
} from './sectionControls';

export type ImageGenerationProviderSectionProps = {
  capabilities: ImageGenerationCapabilities;
  disabled: boolean;
  imageGeneration: ImageGenerationSettings;
  onUpdate: (patch: Partial<ImageGenerationSettings>) => void;
  supportedQualityOptions: ImageGenerationOption[];
};
export const ImageGenerationFalSection = ({
  capabilities,
  disabled,
  imageGeneration,
  onUpdate,
}: Omit<ImageGenerationProviderSectionProps, 'supportedQualityOptions'>) => {
  if (!capabilities.supportsFalOptions) {
    return null;
  }

  return (
    <Field label={t('settings.imageGeneration.fal.title')}>
      <SettingsCard className="grid gap-4 md:grid-cols-2">
        <ToggleSetting
          label={t('settings.imageGeneration.promptOptimizer')}
          checked={imageGeneration.falPromptOptimizer}
          onCheckedChange={(checked) => onUpdate({ falPromptOptimizer: checked })}
          disabled={disabled}
        />
        <ToggleSetting
          label={t('settings.imageGeneration.enableSafetyChecker')}
          checked={imageGeneration.falEnableSafetyChecker}
          onCheckedChange={(checked) => onUpdate({ falEnableSafetyChecker: checked })}
          disabled={disabled}
        />
        <ToggleSetting
          label={t('settings.imageGeneration.syncMode')}
          checked={imageGeneration.falSyncMode}
          onCheckedChange={(checked) => onUpdate({ falSyncMode: checked })}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.safetyTolerance')}
          setting="falSafetyTolerance"
          min={0}
          max={6}
          step={0.1}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
      </SettingsCard>
    </Field>
  );
};


