import { t } from '@/shared/utils/i18n';
import {
  getImageGenerationCapabilities,
  type ImageGenerationSettings,
} from '@/infrastructure/providers/imageGenerationSettings';
import { supportsProviderImageGeneration } from '@/infrastructure/providers/providerImageCatalog';
import {
  ImageGenerationBlackForestLabsSection,
  ImageGenerationDeepInfraSection,
  ImageGenerationFalSection,
  ImageGenerationFireworksSection,
  ImageGenerationGoogleSection,
  ImageGenerationLumaSection,
  ImageGenerationOpenAISection,
  ImageGenerationProdiaSection,
  ImageGenerationReplicateSection,
  ImageGenerationTogetherSection,
  ImageGenerationXaiSection,
} from '@client/features/settings/presentation/settingsModal/ImageGenerationProviderSections';
import { ImageGenerationOutputSection } from '@client/features/settings/presentation/settingsModal/sections/ImageGenerationOutputSection';
import { buildQualityOptions } from '@client/features/settings/presentation/settingsModal/sections/imageGenerationOptions';
import { ImageModelSelector } from '@client/features/settings/presentation/settingsModal/providerTabSections/ImageModelSelector';
import type { ImageGenerationTabProps } from '@client/features/settings/presentation/settingsModal/sections/providerTab.types';

const ImageGenerationTab = ({
  providerId,
  imageModelName,
  imageGeneration,
  mutationsLockedReason,
  onImageGenerationChange,
  ...modelSelectorProps
}: ImageGenerationTabProps) => {
  if (!supportsProviderImageGeneration(providerId)) {
    return (
      <div className="text-sm leading-6 text-[var(--ink-3)]">
        {t('settings.imageGeneration.unsupportedProvider')}
      </div>
    );
  }

  const capabilities = getImageGenerationCapabilities(providerId, imageModelName);
  const disabled = Boolean(mutationsLockedReason);
  const supportedQualityOptions = buildQualityOptions().filter((option) =>
    capabilities.qualityOptions.includes(option.value as ImageGenerationSettings['quality'])
  );
  const updateImageGeneration = (patch: Partial<ImageGenerationSettings>) => {
    onImageGenerationChange({ ...imageGeneration, ...patch });
  };

  return (
    <div className="space-y-4">
      <ImageModelSelector
        providerId={providerId}
        imageModelName={imageModelName}
        {...modelSelectorProps}
      />

      <ImageGenerationOutputSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
      />

      <ImageGenerationOpenAISection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
        supportedQualityOptions={supportedQualityOptions}
      />

      <ImageGenerationXaiSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
        supportedQualityOptions={supportedQualityOptions}
      />

      <ImageGenerationGoogleSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
      />

      <ImageGenerationTogetherSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
      />

      <ImageGenerationFireworksSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
      />

      <ImageGenerationDeepInfraSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
      />

      <ImageGenerationFalSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
      />

      <ImageGenerationReplicateSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
      />

      <ImageGenerationBlackForestLabsSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
      />

      <ImageGenerationProdiaSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
      />

      <ImageGenerationLumaSection
        capabilities={capabilities}
        disabled={disabled}
        imageGeneration={imageGeneration}
        onUpdate={updateImageGeneration}
      />
    </div>
  );
};

export default ImageGenerationTab;

