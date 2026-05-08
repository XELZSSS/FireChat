import type { ProviderId } from '@/shared/types/chat';
import { getImageGenerationCapabilities } from '@/infrastructure/providers/imageGenerationCapabilities';
import { DEFAULT_IMAGE_GENERATION_SETTINGS } from '@/infrastructure/providers/imageGeneration/defaults';
import {
  normalizeImageGenerationSettings,
  selectString,
} from '@/infrastructure/providers/imageGeneration/normalization';
import type {
  ImageGenerationOutputFormat,
  ImageGenerationSettings,
} from '@/infrastructure/providers/imageGeneration/types';

const compactOptions = (options: Record<string, unknown>): Record<string, unknown> => {
  const entries = Object.entries(options).filter(([, value]) => {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  });

  return Object.fromEntries(entries);
};

const setProviderOptions = (
  providerOptions: Record<string, Record<string, unknown>>,
  providerKey: string,
  options: Record<string, unknown>
) => {
  const compacted = compactOptions(options);
  if (Object.keys(compacted).length > 0) {
    providerOptions[providerKey] = compacted;
  }
};

const parseDelimitedList = (value: string, maxItems?: number): string[] => {
  const items = value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return typeof maxItems === 'number' ? items.slice(0, maxItems) : items;
};

const selectSupportedValue = (value: string, options: string[], defaultValue: string): string => {
  if (options.length === 0) {
    return defaultValue;
  }

  return options.includes(value) ? value : options[0];
};

const toReplicateOutputFormat = (format: ImageGenerationOutputFormat): 'png' | 'jpg' | 'webp' =>
  format === 'jpeg' ? 'jpg' : format;

const toBlackForestLabsInputImages = (value: string): Record<string, string> =>
  Object.fromEntries(
    parseDelimitedList(value, 10).map((image, index) => [
      index === 0 ? 'inputImage' : `inputImage${index + 1}`,
      image,
    ])
  );

const toLumaImageConfigs = (
  imageReferences: string,
  weight: number | undefined,
  id: string
): Array<{ weight?: number; id?: string }> => {
  const imageCount = parseDelimitedList(imageReferences, 4).length;
  if (imageCount === 0) {
    return [];
  }

  return Array.from({ length: imageCount }, () =>
    compactOptions({
      weight,
      id,
    }) as { weight?: number; id?: string }
  );
};

export const resolveImageGenerationRuntimeSettings = (
  providerId: ProviderId,
  imageModelName: string | undefined,
  settings: ImageGenerationSettings
) => {
  const normalized = normalizeImageGenerationSettings(settings);
  const capabilities = getImageGenerationCapabilities(providerId, imageModelName);
  const count = capabilities.supportsCount ? Math.min(normalized.count, capabilities.maxCount) : 1;
  const providerOptions: Record<string, Record<string, unknown>> = {};
  const size = selectSupportedValue(
    normalized.size,
    capabilities.sizeOptions,
    DEFAULT_IMAGE_GENERATION_SETTINGS.size
  );
  const aspectRatio = selectSupportedValue(
    normalized.aspectRatio,
    capabilities.aspectRatioOptions,
    DEFAULT_IMAGE_GENERATION_SETTINGS.aspectRatio
  );
  const usesSize =
    capabilities.supportsSize &&
    (!capabilities.supportsAspectRatio || normalized.dimensionMode === 'size');
  const usesAspectRatio =
    capabilities.supportsAspectRatio &&
    (!capabilities.supportsSize || normalized.dimensionMode === 'aspectRatio');
  const quality = selectString(
    normalized.quality,
    capabilities.qualityOptions,
    capabilities.qualityOptions[0] ?? normalized.quality
  );

  if (capabilities.supportsOpenAIOptions) {
    setProviderOptions(providerOptions, 'openai', {
      quality,
      background: capabilities.supportsOpenAIBackgroundOptions ? normalized.background : undefined,
      outputFormat: capabilities.supportsOpenAIOutputOptions ? normalized.outputFormat : undefined,
      ...(capabilities.supportsOpenAIOutputOptions &&
      (normalized.outputFormat === 'jpeg' || normalized.outputFormat === 'webp')
        ? { outputCompression: normalized.outputCompression }
        : {}),
      style:
        capabilities.supportsOpenAIStyleOptions && normalized.openAIStyle !== 'none'
          ? normalized.openAIStyle
          : undefined,
      moderation:
        capabilities.supportsOpenAIModerationOptions && normalized.openAIModeration !== 'none'
          ? normalized.openAIModeration
          : undefined,
      user: normalized.openAIUser,
    });
  }

  if (capabilities.supportsXaiOptions) {
    setProviderOptions(providerOptions, 'xai', {
      resolution: normalized.xaiResolution,
      quality,
      output_format: normalized.outputFormat,
    });
  }

  if (capabilities.supportsGoogleOptions) {
    setProviderOptions(providerOptions, 'google', {
      personGeneration: normalized.googlePersonGeneration,
      aspectRatio,
    });
  }

  if (capabilities.supportsGoogleVertexOptions) {
    setProviderOptions(providerOptions, 'vertex', {
      personGeneration: normalized.googlePersonGeneration,
    });
  }

  if (capabilities.supportsTogetherOptions) {
    setProviderOptions(providerOptions, 'togetherai', {
      steps: normalized.togetherSteps,
      guidance: normalized.togetherGuidance,
      negative_prompt: normalized.togetherNegativePrompt,
      disable_safety_checker: normalized.togetherDisableSafetyChecker,
    });
  }

  if (capabilities.supportsFireworksOptions) {
    setProviderOptions(providerOptions, 'fireworks', {
      steps: normalized.fireworksSteps,
      cfg_scale: normalized.fireworksCfgScale,
      negative_prompt: normalized.fireworksNegativePrompt,
    });
  }

  if (capabilities.supportsDeepInfraOptions) {
    setProviderOptions(providerOptions, 'deepinfra', {
      num_inference_steps: normalized.deepInfraNumInferenceSteps,
      guidance_scale: normalized.deepInfraGuidanceScale,
      negative_prompt: normalized.deepInfraNegativePrompt,
    });
  }

  if (capabilities.supportsFalOptions) {
    setProviderOptions(providerOptions, 'fal', {
      prompt_optimizer: normalized.falPromptOptimizer,
      enable_safety_checker: normalized.falEnableSafetyChecker,
      safety_tolerance: normalized.falSafetyTolerance,
      sync_mode: normalized.falSyncMode,
    });
  }

  if (capabilities.supportsReplicateOptions) {
    setProviderOptions(providerOptions, 'replicate', {
      maxWaitTimeInSeconds: normalized.replicateMaxWaitTimeInSeconds,
      guidance_scale: normalized.replicateGuidanceScale,
      num_inference_steps: normalized.replicateNumInferenceSteps,
      negative_prompt: normalized.replicateNegativePrompt,
      output_format: toReplicateOutputFormat(normalized.replicateOutputFormat),
      output_quality: normalized.replicateOutputQuality,
      strength: normalized.replicateStrength,
    });
  }

  if (capabilities.supportsBlackForestLabsOptions) {
    setProviderOptions(providerOptions, 'blackForestLabs', {
      imagePrompt: normalized.blackForestLabsImagePrompt,
      imagePromptStrength: normalized.blackForestLabsImagePromptStrength,
      ...toBlackForestLabsInputImages(normalized.blackForestLabsInputImages),
      steps: normalized.blackForestLabsSteps,
      guidance: normalized.blackForestLabsGuidance,
      outputFormat: normalized.blackForestLabsOutputFormat,
      promptUpsampling: normalized.blackForestLabsPromptUpsampling,
      raw: normalized.blackForestLabsRaw,
      safetyTolerance: normalized.blackForestLabsSafetyTolerance,
      webhookUrl: normalized.blackForestLabsWebhookUrl,
      webhookSecret: normalized.blackForestLabsWebhookSecret,
      pollIntervalMillis: normalized.blackForestLabsPollIntervalMillis,
      pollTimeoutMillis: normalized.blackForestLabsPollTimeoutMillis,
    });
  }

  if (capabilities.supportsProdiaOptions) {
    setProviderOptions(providerOptions, 'prodia', {
      steps: normalized.prodiaSteps,
      stylePreset:
        normalized.prodiaStylePreset === 'none' ? undefined : normalized.prodiaStylePreset,
      loras: parseDelimitedList(normalized.prodiaLoras),
      progressive: normalized.prodiaProgressive,
    });
  }

  if (capabilities.supportsLumaOptions) {
    setProviderOptions(providerOptions, 'luma', {
      referenceType:
        normalized.lumaReferenceType === 'none' ? undefined : normalized.lumaReferenceType,
      images: toLumaImageConfigs(
        normalized.lumaReferenceImages,
        normalized.lumaReferenceWeight,
        normalized.lumaReferenceId
      ),
      pollIntervalMillis: normalized.lumaPollIntervalMillis,
      maxPollAttempts: normalized.lumaMaxPollAttempts,
    });
  }

  return {
    capabilities,
    count,
    size: usesSize ? size : undefined,
    aspectRatio: usesAspectRatio || capabilities.supportsGoogleOptions ? aspectRatio : undefined,
    seed: capabilities.supportsSeed ? normalized.seed : undefined,
    promptImages: capabilities.supportsLumaOptions
      ? parseDelimitedList(normalized.lumaReferenceImages, 4)
      : [],
    providerOptions: Object.keys(providerOptions).length > 0 ? providerOptions : undefined,
    metadata: {
      size: usesSize ? size : usesAspectRatio ? aspectRatio : undefined,
      quality:
        capabilities.supportsOpenAIOptions || capabilities.supportsXaiOptions ? quality : undefined,
      background: capabilities.supportsOpenAIBackgroundOptions ? normalized.background : undefined,
      outputFormat:
        capabilities.supportsOpenAIOutputOptions || capabilities.supportsXaiOptions
          ? normalized.outputFormat
          : undefined,
    },
  };
};
