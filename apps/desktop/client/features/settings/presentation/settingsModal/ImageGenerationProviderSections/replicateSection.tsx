import { Dropdown, Field } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import type {
  ImageGenerationCapabilities,
  ImageGenerationSettings,
} from '@/infrastructure/providers/imageGenerationSettings';
import {
  SettingsCard,
  SettingsControlGroup,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import {
  OUTPUT_FORMAT_OPTIONS,
  type ImageGenerationOption,
} from '@client/features/settings/presentation/settingsModal/sections/imageGenerationOptions';
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
export const ImageGenerationReplicateSection = ({
  capabilities,
  disabled,
  imageGeneration,
  onUpdate,
}: Omit<ImageGenerationProviderSectionProps, 'supportedQualityOptions'>) => {
  if (!capabilities.supportsReplicateOptions) {
    return null;
  }

  return (
    <Field label={t('settings.imageGeneration.replicate.title')}>
      <SettingsCard className="grid gap-4 md:grid-cols-2">
        <NumberSetting
          label={t('settings.imageGeneration.maxWaitTime')}
          setting="replicateMaxWaitTimeInSeconds"
          min={1}
          max={3600}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.numInferenceSteps')}
          setting="replicateNumInferenceSteps"
          min={1}
          max={150}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.guidanceScale')}
          setting="replicateGuidanceScale"
          min={0}
          max={30}
          step={0.1}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.strength')}
          setting="replicateStrength"
          min={0}
          max={1}
          step={0.01}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <SettingsControlGroup label={t('settings.imageGeneration.outputFormat')}>
          <Dropdown
            value={imageGeneration.replicateOutputFormat}
            options={OUTPUT_FORMAT_OPTIONS}
            onChange={(value) =>
              onUpdate({
                replicateOutputFormat: value as ImageGenerationSettings['replicateOutputFormat'],
              })
            }
            widthClassName="w-full"
            disabled={disabled}
          />
        </SettingsControlGroup>
        <NumberSetting
          label={t('settings.imageGeneration.outputQuality')}
          setting="replicateOutputQuality"
          min={0}
          max={100}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <TextSetting
          label={t('settings.imageGeneration.negativePrompt')}
          setting="replicateNegativePrompt"
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
      </SettingsCard>
    </Field>
  );
};


