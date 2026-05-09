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
  PRODIA_STYLE_PRESET_OPTIONS,
  type ImageGenerationOption,
} from '@client/features/settings/presentation/settingsModal/sections/imageGenerationOptions';
import {
  NumberSetting,
  TextAreaSetting,
  ToggleSetting,
} from './sectionControls';

export type ImageGenerationProviderSectionProps = {
  capabilities: ImageGenerationCapabilities;
  disabled: boolean;
  imageGeneration: ImageGenerationSettings;
  onUpdate: (patch: Partial<ImageGenerationSettings>) => void;
  supportedQualityOptions: ImageGenerationOption[];
};
export const ImageGenerationProdiaSection = ({
  capabilities,
  disabled,
  imageGeneration,
  onUpdate,
}: Omit<ImageGenerationProviderSectionProps, 'supportedQualityOptions'>) => {
  if (!capabilities.supportsProdiaOptions) {
    return null;
  }

  return (
    <Field label={t('settings.imageGeneration.prodia.title')}>
      <SettingsCard className="grid gap-4 md:grid-cols-2">
        <NumberSetting
          label={t('settings.imageGeneration.steps')}
          setting="prodiaSteps"
          min={1}
          max={150}
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <SettingsControlGroup label={t('settings.imageGeneration.stylePreset')}>
          <Dropdown
            value={imageGeneration.prodiaStylePreset}
            options={PRODIA_STYLE_PRESET_OPTIONS}
            onChange={(value) =>
              onUpdate({
                prodiaStylePreset: value as ImageGenerationSettings['prodiaStylePreset'],
              })
            }
            widthClassName="w-full"
            disabled={disabled}
          />
        </SettingsControlGroup>
        <TextAreaSetting
          label={t('settings.imageGeneration.loras')}
          setting="prodiaLoras"
          imageGeneration={imageGeneration}
          onUpdate={onUpdate}
          disabled={disabled}
        />
        <ToggleSetting
          label={t('settings.imageGeneration.progressive')}
          checked={imageGeneration.prodiaProgressive}
          onCheckedChange={(checked) => onUpdate({ prodiaProgressive: checked })}
          disabled={disabled}
        />
      </SettingsCard>
    </Field>
  );
};


