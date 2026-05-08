import type {
  ImageGenerationBackground,
  ImageGenerationBlackForestLabsOutputFormat,
  ImageGenerationDimensionMode,
  ImageGenerationGooglePersonGeneration,
  ImageGenerationLumaReferenceType,
  ImageGenerationOpenAIModeration,
  ImageGenerationOpenAIStyle,
  ImageGenerationOutputFormat,
  ImageGenerationProdiaStylePreset,
  ImageGenerationQuality,
  ImageGenerationSettings,
  ImageGenerationXaiResolution,
} from '@/infrastructure/providers/imageGeneration/types';
import { getDefaultImageGenerationSettings } from '@/infrastructure/providers/imageGeneration/defaults';

const DIMENSION_MODES: ImageGenerationDimensionMode[] = ['size', 'aspectRatio'];
const QUALITIES: ImageGenerationQuality[] = ['auto', 'standard', 'low', 'medium', 'high', 'hd'];
const BACKGROUNDS: ImageGenerationBackground[] = ['auto', 'opaque', 'transparent'];
const OUTPUT_FORMATS: ImageGenerationOutputFormat[] = ['png', 'jpeg', 'webp'];
const XAI_RESOLUTIONS: ImageGenerationXaiResolution[] = ['1k', '2k'];
const OPENAI_STYLES: ImageGenerationOpenAIStyle[] = ['none', 'vivid', 'natural'];
const OPENAI_MODERATIONS: ImageGenerationOpenAIModeration[] = ['none', 'auto', 'low'];
const GOOGLE_PERSON_GENERATION: ImageGenerationGooglePersonGeneration[] = [
  'dont_allow',
  'allow_adult',
  'allow_all',
];
const PRODIA_STYLE_PRESETS: ImageGenerationProdiaStylePreset[] = [
  'none',
  '3d-model',
  'analog-film',
  'anime',
  'cinematic',
  'comic-book',
  'digital-art',
  'enhance',
  'fantasy-art',
  'isometric',
  'line-art',
  'low-poly',
  'neon-punk',
  'origami',
  'photographic',
  'pixel-art',
  'texture',
  'craft-clay',
];
const LUMA_REFERENCE_TYPES: ImageGenerationLumaReferenceType[] = [
  'none',
  'image',
  'style',
  'character',
  'modify_image',
];
const BLACK_FOREST_LABS_OUTPUT_FORMATS: ImageGenerationBlackForestLabsOutputFormat[] = [
  'png',
  'jpeg',
];

const clampInteger = (value: unknown, min: number, max: number, defaultValue: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return defaultValue;
  }

  return Math.min(Math.max(Math.trunc(value), min), max);
};

const optionalInteger = (value: unknown, min: number, max: number): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.min(Math.max(Math.trunc(value), min), max);
};

const optionalNumber = (value: unknown, min: number, max: number): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.min(Math.max(value, min), max);
};

export const selectString = <T extends string>(value: unknown, allowed: T[], defaultValue: T): T =>
  typeof value === 'string' && allowed.includes(value as T) ? (value as T) : defaultValue;

const normalizeDimensionValue = (value: unknown, pattern: RegExp, defaultValue: string): string =>
  typeof value === 'string' && pattern.test(value.trim()) ? value.trim() : defaultValue;

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeBoolean = (value: unknown, defaultValue: boolean): boolean =>
  typeof value === 'boolean' ? value : defaultValue;

export const normalizeImageGenerationSettings = (value: unknown): ImageGenerationSettings => {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<ImageGenerationSettings>)
      : {};
  const defaults = getDefaultImageGenerationSettings();

  return {
    count: clampInteger(source.count, 1, 10, defaults.count),
    dimensionMode: selectString(source.dimensionMode, DIMENSION_MODES, defaults.dimensionMode),
    size: normalizeDimensionValue(source.size, /^\d+x\d+$|^auto$/, defaults.size),
    aspectRatio: normalizeDimensionValue(
      source.aspectRatio,
      /^(?:auto|\d+(?:\.\d+)?:\d+(?:\.\d+)?)$/,
      defaults.aspectRatio
    ),
    seed:
      typeof source.seed === 'number' && Number.isFinite(source.seed)
        ? Math.max(0, Math.trunc(source.seed))
        : undefined,
    quality: selectString(source.quality, QUALITIES, defaults.quality),
    background: selectString(source.background, BACKGROUNDS, defaults.background),
    outputFormat: selectString(source.outputFormat, OUTPUT_FORMATS, defaults.outputFormat),
    outputCompression: clampInteger(source.outputCompression, 0, 100, defaults.outputCompression),
    openAIStyle: selectString(source.openAIStyle, OPENAI_STYLES, defaults.openAIStyle),
    openAIModeration: selectString(
      source.openAIModeration,
      OPENAI_MODERATIONS,
      defaults.openAIModeration
    ),
    openAIUser: normalizeText(source.openAIUser),
    xaiResolution: selectString(source.xaiResolution, XAI_RESOLUTIONS, defaults.xaiResolution),
    googlePersonGeneration: selectString(
      source.googlePersonGeneration,
      GOOGLE_PERSON_GENERATION,
      defaults.googlePersonGeneration
    ),
    togetherSteps: optionalInteger(source.togetherSteps, 1, 150),
    togetherGuidance: optionalNumber(source.togetherGuidance, 0, 30),
    togetherNegativePrompt: normalizeText(source.togetherNegativePrompt),
    togetherDisableSafetyChecker: normalizeBoolean(
      source.togetherDisableSafetyChecker,
      defaults.togetherDisableSafetyChecker
    ),
    fireworksSteps: optionalInteger(source.fireworksSteps, 1, 150),
    fireworksCfgScale: optionalNumber(source.fireworksCfgScale, 0, 30),
    fireworksNegativePrompt: normalizeText(source.fireworksNegativePrompt),
    deepInfraNumInferenceSteps: optionalInteger(source.deepInfraNumInferenceSteps, 1, 150),
    deepInfraGuidanceScale: optionalNumber(source.deepInfraGuidanceScale, 0, 30),
    deepInfraNegativePrompt: normalizeText(source.deepInfraNegativePrompt),
    falPromptOptimizer: normalizeBoolean(source.falPromptOptimizer, defaults.falPromptOptimizer),
    falEnableSafetyChecker: normalizeBoolean(
      source.falEnableSafetyChecker,
      defaults.falEnableSafetyChecker
    ),
    falSafetyTolerance: optionalNumber(source.falSafetyTolerance, 0, 6),
    falSyncMode: normalizeBoolean(source.falSyncMode, defaults.falSyncMode),
    replicateMaxWaitTimeInSeconds: optionalInteger(source.replicateMaxWaitTimeInSeconds, 1, 3600),
    replicateGuidanceScale: optionalNumber(source.replicateGuidanceScale, 0, 30),
    replicateNumInferenceSteps: optionalInteger(source.replicateNumInferenceSteps, 1, 150),
    replicateNegativePrompt: normalizeText(source.replicateNegativePrompt),
    replicateOutputFormat: selectString(
      source.replicateOutputFormat,
      OUTPUT_FORMATS,
      defaults.replicateOutputFormat
    ),
    replicateOutputQuality: optionalInteger(source.replicateOutputQuality, 0, 100),
    replicateStrength: optionalNumber(source.replicateStrength, 0, 1),
    blackForestLabsImagePrompt: normalizeText(source.blackForestLabsImagePrompt),
    blackForestLabsImagePromptStrength: optionalNumber(
      source.blackForestLabsImagePromptStrength,
      0,
      1
    ),
    blackForestLabsInputImages: normalizeText(source.blackForestLabsInputImages),
    blackForestLabsSteps: optionalInteger(source.blackForestLabsSteps, 1, 150),
    blackForestLabsGuidance: optionalNumber(source.blackForestLabsGuidance, 0, 30),
    blackForestLabsOutputFormat: selectString(
      source.blackForestLabsOutputFormat,
      BLACK_FOREST_LABS_OUTPUT_FORMATS,
      defaults.blackForestLabsOutputFormat
    ),
    blackForestLabsPromptUpsampling: normalizeBoolean(
      source.blackForestLabsPromptUpsampling,
      defaults.blackForestLabsPromptUpsampling
    ),
    blackForestLabsRaw: normalizeBoolean(source.blackForestLabsRaw, defaults.blackForestLabsRaw),
    blackForestLabsSafetyTolerance: optionalNumber(source.blackForestLabsSafetyTolerance, 0, 6),
    blackForestLabsWebhookUrl: normalizeText(source.blackForestLabsWebhookUrl),
    blackForestLabsWebhookSecret: normalizeText(source.blackForestLabsWebhookSecret),
    blackForestLabsPollIntervalMillis: optionalInteger(
      source.blackForestLabsPollIntervalMillis,
      1,
      600000
    ),
    blackForestLabsPollTimeoutMillis: optionalInteger(
      source.blackForestLabsPollTimeoutMillis,
      1,
      3600000
    ),
    prodiaSteps: optionalInteger(source.prodiaSteps, 1, 150),
    prodiaStylePreset: selectString(
      source.prodiaStylePreset,
      PRODIA_STYLE_PRESETS,
      defaults.prodiaStylePreset
    ),
    prodiaLoras: normalizeText(source.prodiaLoras),
    prodiaProgressive: normalizeBoolean(source.prodiaProgressive, defaults.prodiaProgressive),
    lumaReferenceType: selectString(
      source.lumaReferenceType,
      LUMA_REFERENCE_TYPES,
      defaults.lumaReferenceType
    ),
    lumaReferenceImages: normalizeText(source.lumaReferenceImages),
    lumaReferenceWeight: optionalNumber(source.lumaReferenceWeight, 0, 1),
    lumaReferenceId: normalizeText(source.lumaReferenceId),
    lumaPollIntervalMillis: optionalInteger(source.lumaPollIntervalMillis, 1, 600000),
    lumaMaxPollAttempts: optionalInteger(source.lumaMaxPollAttempts, 1, 10000),
  };
};
