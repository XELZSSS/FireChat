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
  buildBackgroundOptions,
  getDropdownValue,
  type ImageGenerationOption,
  OPENAI_MODERATION_OPTIONS,
  OPENAI_STYLE_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
} from '@client/features/settings/presentation/settingsModal/sections/imageGenerationOptions';
import {
  TextSetting,
} from './sectionControls';

export type ImageGenerationProviderSectionProps = {
  capabilities: ImageGenerationCapabilities;
  disabled: boolean;
  imageGeneration: ImageGenerationSettings;
  onUpdate: (patch: Partial<ImageGenerationSettings>) => void;
  supportedQualityOptions: ImageGenerationOption[];
};
export const ImageGenerationOpenAISection = ({
  capabilities,
  disabled,
  imageGeneration,
  onUpdate,
  supportedQualityOptions,
}: ImageGenerationProviderSectionProps) => {
  if (!capabilities.supportsOpenAIOptions) {
    return null;
  }

  const backgroundOptions = buildBackgroundOptions();

  return (
    <Field label={t('settings.imageGeneration.openai.title')}>
      <SettingsCard className="grid gap-4 md:grid-cols-2">
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
        {capabilities.supportsOpenAIBackgroundOptions ? (
          <SettingsControlGroup label={t('settings.imageGeneration.background')}>
            <Dropdown
              value={imageGeneration.background}
              options={backgroundOptions}
              onChange={(value) =>
                onUpdate({
                  background: value as ImageGenerationSettings['background'],
                })
              }
              widthClassName="w-full"
              disabled={disabled}
            />
          </SettingsControlGroup>
        ) : null}
        {capabilities.supportsOpenAIOutputOptions ? (
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
        ) : null}
        {capabilities.supportsOpenAIOutputOptions &&
        (imageGeneration.outputFormat === 'jpeg' || imageGeneration.outputFormat === 'webp') ? (
          <SettingsControlGroup label={t('settings.imageGeneration.outputCompression')}>
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={imageGeneration.outputCompression}
              className="block w-full"
              onChange={(event) => onUpdate({ outputCompression: Number(event.target.value) })}
              disabled={disabled}
            />
          </SettingsControlGroup>
        ) : null}
        {capabilities.supportsOpenAIStyleOptions ? (
          <SettingsControlGroup label={t('settings.imageGeneration.style')}>
            <Dropdown
              value={imageGeneration.openAIStyle}
              options={OPENAI_STYLE_OPTIONS}
              onChange={(value) =>
                onUpdate({
                  openAIStyle: value as ImageGenerationSettings['openAIStyle'],
                })
              }
              widthClassName="w-full"
              disabled={disabled}
            />
          </SettingsControlGroup>
        ) : null}
        {capabilities.supportsOpenAIModerationOptions ? (
          <SettingsControlGroup label={t('settings.imageGeneration.moderation')}>
            <Dropdown
              value={imageGeneration.openAIModeration}
              options={OPENAI_MODERATION_OPTIONS}
              onChange={(value) =>
                onUpdate({
                  openAIModeration: value as ImageGenerationSettings['openAIModeration'],
                })
              }
              widthClassName="w-full"
              disabled={disabled}
            />
          </SettingsControlGroup>
        ) : null}
        <TextSetting
          label={t('settings.imageGeneration.user')}
          setting="openAIUser"
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
      </SettingsCard>
    </Field>
  );
};


