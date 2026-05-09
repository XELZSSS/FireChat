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
  LUMA_REFERENCE_TYPE_OPTIONS,
  type ImageGenerationOption,
} from '@client/features/settings/presentation/settingsModal/sections/imageGenerationOptions';
import {
  NumberSetting,
  TextAreaSetting,
  TextSetting,
} from './sectionControls';

export type ImageGenerationProviderSectionProps = {
  capabilities: ImageGenerationCapabilities;
  disabled: boolean;
  imageGeneration: ImageGenerationSettings;
  onUpdate: (patch: Partial<ImageGenerationSettings>) => void;
  supportedQualityOptions: ImageGenerationOption[];
};
export const ImageGenerationLumaSection = ({
  capabilities,
  disabled,
  imageGeneration,
  onUpdate,
}: Omit<ImageGenerationProviderSectionProps, 'supportedQualityOptions'>) => {
  if (!capabilities.supportsLumaOptions) {
    return null;
  }

  return (
    <Field label={t('settings.imageGeneration.luma.title')}>
      <SettingsCard className="grid gap-4 md:grid-cols-2">
        <SettingsControlGroup label={t('settings.imageGeneration.referenceType')}>
          <Dropdown
            value={imageGeneration.lumaReferenceType}
            options={LUMA_REFERENCE_TYPE_OPTIONS}
            onChange={(value) =>
              onUpdate({
                lumaReferenceType: value as ImageGenerationSettings['lumaReferenceType'],
              })
            }
            widthClassName="w-full"
            disabled={disabled}
          />
        </SettingsControlGroup>
        <NumberSetting
          label={t('settings.imageGeneration.referenceWeight')}
          setting="lumaReferenceWeight"
          min={0}
          max={1}
          step={0.01}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <TextSetting
          label={t('settings.imageGeneration.referenceId')}
          setting="lumaReferenceId"
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <TextAreaSetting
          label={t('settings.imageGeneration.referenceImages')}
          setting="lumaReferenceImages"
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.pollIntervalMillis')}
          setting="lumaPollIntervalMillis"
          min={1}
          max={600000}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.maxPollAttempts')}
          setting="lumaMaxPollAttempts"
          min={1}
          max={10000}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
      </SettingsCard>
    </Field>
  );
};


