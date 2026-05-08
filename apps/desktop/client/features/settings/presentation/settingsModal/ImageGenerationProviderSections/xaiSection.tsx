import { Dropdown, Field, Input } from '@/shared/ui';
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
  BLACK_FOREST_LABS_OUTPUT_FORMAT_OPTIONS,
  buildBackgroundOptions,
  getDropdownValue,
  GOOGLE_PERSON_OPTIONS,
  LUMA_REFERENCE_TYPE_OPTIONS,
  type ImageGenerationOption,
  OPENAI_MODERATION_OPTIONS,
  OPENAI_STYLE_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
  PRODIA_STYLE_PRESET_OPTIONS,
  XAI_RESOLUTION_OPTIONS,
} from '@client/features/settings/presentation/settingsModal/sections/imageGenerationOptions';
import {
  NumberSetting,
  TextAreaSetting,
  TextSetting,
  ToggleSetting,
} from './sectionControls';

export type ImageGenerationProviderSectionProps = {
  capabilities: ImageGenerationCapabilities;
  disabled: boolean;
  imageGeneration: ImageGenerationSettings;
  onUpdate: (patch: Partial<ImageGenerationSettings>) => void;
  supportedQualityOptions: ImageGenerationOption[];
};
export const ImageGenerationXaiSection = ({
  capabilities,
  disabled,
  imageGeneration,
  onUpdate,
  supportedQualityOptions,
}: ImageGenerationProviderSectionProps) => {
  if (!capabilities.supportsXaiOptions) {
    return null;
  }

  return (
    <Field label={t('settings.imageGeneration.xai.title')}>
      <SettingsCard className="grid gap-4 md:grid-cols-2">
        <SettingsControlGroup label={t('settings.imageGeneration.resolution')}>
          <Dropdown
            value={imageGeneration.xaiResolution}
            options={XAI_RESOLUTION_OPTIONS}
            onChange={(value) =>
              onUpdate({
                xaiResolution: value as ImageGenerationSettings['xaiResolution'],
              })
            }
            widthClassName="w-full"
            disabled={disabled}
          />
        </SettingsControlGroup>
        <SettingsControlGroup label={t('settings.imageGeneration.quality')}>
          <Dropdown
            value={getDropdownValue(imageGeneration.quality, supportedQualityOptions)}
            options={supportedQualityOptions}
            onChange={(value) =>
              onUpdate({
                quality: value as ImageGenerationSettings['quality'],
              })
            }
            widthClassName="w-full"
            disabled={disabled}
          />
        </SettingsControlGroup>
        <SettingsControlGroup label={t('settings.imageGeneration.outputFormat')}>
          <Dropdown
            value={imageGeneration.outputFormat}
            options={OUTPUT_FORMAT_OPTIONS}
            onChange={(value) =>
              onUpdate({
                outputFormat: value as ImageGenerationSettings['outputFormat'],
              })
            }
            widthClassName="w-full"
            disabled={disabled}
          />
        </SettingsControlGroup>
      </SettingsCard>
    </Field>
  );
};


