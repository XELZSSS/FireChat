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
export const ImageGenerationBlackForestLabsSection = ({
  capabilities,
  disabled,
  imageGeneration,
  onUpdate,
}: Omit<ImageGenerationProviderSectionProps, 'supportedQualityOptions'>) => {
  if (!capabilities.supportsBlackForestLabsOptions) {
    return null;
  }

  return (
    <Field label={t('settings.imageGeneration.blackForestLabs.title')}>
      <SettingsCard className="grid gap-4 md:grid-cols-2">
        <TextSetting
          label={t('settings.imageGeneration.imagePrompt')}
          setting="blackForestLabsImagePrompt"
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.imagePromptStrength')}
          setting="blackForestLabsImagePromptStrength"
          min={0}
          max={1}
          step={0.01}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <TextAreaSetting
          label={t('settings.imageGeneration.inputImages')}
          setting="blackForestLabsInputImages"
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.steps')}
          setting="blackForestLabsSteps"
          min={1}
          max={150}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.guidance')}
          setting="blackForestLabsGuidance"
          min={0}
          max={30}
          step={0.1}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <SettingsControlGroup label={t('settings.imageGeneration.outputFormat')}>
          <Dropdown
            value={imageGeneration.blackForestLabsOutputFormat}
            options={BLACK_FOREST_LABS_OUTPUT_FORMAT_OPTIONS}
            onChange={(value) =>
              onUpdate({
                blackForestLabsOutputFormat:
                  value as ImageGenerationSettings['blackForestLabsOutputFormat'],
              })
            }
            widthClassName="w-full"
            disabled={disabled}
          />
        </SettingsControlGroup>
        <NumberSetting
          label={t('settings.imageGeneration.safetyTolerance')}
          setting="blackForestLabsSafetyTolerance"
          min={0}
          max={6}
          step={0.1}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <ToggleSetting
          label={t('settings.imageGeneration.promptUpsampling')}
          checked={imageGeneration.blackForestLabsPromptUpsampling}
          onCheckedChange={(checked) => onUpdate({ blackForestLabsPromptUpsampling: checked })}
          disabled={disabled}
        />
        <ToggleSetting
          label={t('settings.imageGeneration.raw')}
          checked={imageGeneration.blackForestLabsRaw}
          onCheckedChange={(checked) => onUpdate({ blackForestLabsRaw: checked })}
          disabled={disabled}
        />
        <TextSetting
          label={t('settings.imageGeneration.webhookUrl')}
          setting="blackForestLabsWebhookUrl"
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <TextSetting
          label={t('settings.imageGeneration.webhookSecret')}
          setting="blackForestLabsWebhookSecret"
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.pollIntervalMillis')}
          setting="blackForestLabsPollIntervalMillis"
          min={1}
          max={600000}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <NumberSetting
          label={t('settings.imageGeneration.pollTimeoutMillis')}
          setting="blackForestLabsPollTimeoutMillis"
          min={1}
          max={3600000}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
      </SettingsCard>
    </Field>
  );
};


