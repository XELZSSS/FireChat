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
  buildDimensionModeOptions,
  getDropdownValue,
  toCountOptions,
  toValueOptions,
} from '@client/features/settings/presentation/settingsModal/sections/imageGenerationOptions';

type ImageGenerationOutputSectionProps = {
  capabilities: ImageGenerationCapabilities;
  disabled: boolean;
  imageGeneration: ImageGenerationSettings;
  onUpdate: (patch: Partial<ImageGenerationSettings>) => void;
};

export const ImageGenerationOutputSection = ({
  capabilities,
  disabled,
  imageGeneration,
  onUpdate,
}: ImageGenerationOutputSectionProps) => {
  const dimensionModeOptions = buildDimensionModeOptions();
  const sizeOptions = toValueOptions(capabilities.sizeOptions);
  const aspectRatioOptions = toValueOptions(capabilities.aspectRatioOptions);

  return (
    <Field label={t('settings.imageGeneration.output.title')}>
      <SettingsCard className="grid gap-4 md:grid-cols-2">
        {capabilities.supportsCount ? (
          <SettingsControlGroup label={t('settings.imageGeneration.count')}>
            <Dropdown
              value={String(Math.min(imageGeneration.count, capabilities.maxCount))}
              options={toCountOptions(capabilities.maxCount)}
              onChange={(value) => onUpdate({ count: Number(value) })}
              widthClassName="w-full"
              disabled={disabled}
            />
          </SettingsControlGroup>
        ) : null}

        {capabilities.supportsSize && capabilities.supportsAspectRatio ? (
          <SettingsControlGroup label={t('settings.imageGeneration.dimension.mode')}>
            <Dropdown
              value={imageGeneration.dimensionMode}
              options={dimensionModeOptions}
              onChange={(value) =>
                onUpdate({
                  dimensionMode: value as ImageGenerationSettings['dimensionMode'],
                })
              }
              widthClassName="w-full"
              disabled={disabled}
            />
          </SettingsControlGroup>
        ) : null}

        {capabilities.supportsSize &&
        (!capabilities.supportsAspectRatio || imageGeneration.dimensionMode === 'size') ? (
          <SettingsControlGroup label={t('settings.imageGeneration.size')}>
            <Dropdown
              value={getDropdownValue(imageGeneration.size, sizeOptions)}
              options={sizeOptions}
              onChange={(value) => onUpdate({ size: value })}
              widthClassName="w-full"
              disabled={disabled}
            />
          </SettingsControlGroup>
        ) : null}

        {capabilities.supportsAspectRatio &&
        (!capabilities.supportsSize || imageGeneration.dimensionMode === 'aspectRatio') ? (
          <SettingsControlGroup label={t('settings.imageGeneration.aspectRatio')}>
            <Dropdown
              value={getDropdownValue(imageGeneration.aspectRatio, aspectRatioOptions)}
              options={aspectRatioOptions}
              onChange={(value) => onUpdate({ aspectRatio: value })}
              widthClassName="w-full"
              disabled={disabled}
            />
          </SettingsControlGroup>
        ) : null}

        {capabilities.supportsSeed ? (
          <SettingsControlGroup label={t('settings.imageGeneration.seed')}>
            <Input
              type="number"
              min={0}
              step={1}
              value={imageGeneration.seed ?? ''}
              className="block w-full"
              onChange={(event) =>
                onUpdate({
                  seed: event.target.value ? Number(event.target.value) : undefined,
                })
              }
              disabled={disabled}
            />
          </SettingsControlGroup>
        ) : null}
      </SettingsCard>
    </Field>
  );
};

