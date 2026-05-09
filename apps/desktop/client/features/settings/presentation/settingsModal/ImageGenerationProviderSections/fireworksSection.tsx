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
  TextSetting,
} from './sectionControls';

export type ImageGenerationProviderSectionProps = {
  capabilities: ImageGenerationCapabilities;
  disabled: boolean;
  imageGeneration: ImageGenerationSettings;
  onUpdate: (patch: Partial<ImageGenerationSettings>) => void;
  supportedQualityOptions: ImageGenerationOption[];
};
export const ImageGenerationFireworksSection = ({
  capabilities,
  disabled,
  imageGeneration,
  onUpdate,
}: Omit<ImageGenerationProviderSectionProps, 'supportedQualityOptions'>) => {
  if (!capabilities.supportsFireworksOptions) {
    return null;
  }

  return (
    <Field label={t('settings.imageGeneration.fireworks.title')}>
      <SettingsCard className="grid gap-4 md:grid-cols-2">
        <NumberSetting
          label={t('settings.imageGeneration.steps')}
          setting="fireworksSteps"
          min={1}
          max={150}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.cfgScale')}
          setting="fireworksCfgScale"
          min={0}
          max={30}
          step={0.1}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <TextSetting
          label={t('settings.imageGeneration.negativePrompt')}
          setting="fireworksNegativePrompt"
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
      </SettingsCard>
    </Field>
  );
};


