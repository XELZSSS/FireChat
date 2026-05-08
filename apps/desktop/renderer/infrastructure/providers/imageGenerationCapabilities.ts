import type { ProviderId } from '@/shared/types/chat';
import type { ImageGenerationQuality } from '@/infrastructure/providers/imageGenerationSettings';
import { supportsImageGenerationProvider } from '@/infrastructure/providers/providerImageMetadata';

export type ImageGenerationCapabilities = {
  supportsCount: boolean;
  supportsSize: boolean;
  supportsAspectRatio: boolean;
  supportsSeed: boolean;
  supportsOpenAIOptions: boolean;
  supportsOpenAIBackgroundOptions: boolean;
  supportsOpenAIOutputOptions: boolean;
  supportsOpenAIStyleOptions: boolean;
  supportsOpenAIModerationOptions: boolean;
  supportsXaiOptions: boolean;
  supportsGoogleOptions: boolean;
  supportsGoogleVertexOptions: boolean;
  supportsTogetherOptions: boolean;
  supportsFireworksOptions: boolean;
  supportsDeepInfraOptions: boolean;
  supportsFalOptions: boolean;
  supportsReplicateOptions: boolean;
  supportsBlackForestLabsOptions: boolean;
  supportsProdiaOptions: boolean;
  supportsLumaOptions: boolean;
  maxCount: number;
  sizeOptions: string[];
  aspectRatioOptions: string[];
  qualityOptions: ImageGenerationQuality[];
};

const COMMON_ASPECT_RATIO_OPTIONS = ['1:1', '4:3', '3:4', '16:9', '9:16'];
const GOOGLE_GEMINI_IMAGE_ASPECT_RATIO_OPTIONS = [
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
];
const FIREWORKS_ASPECT_RATIO_OPTIONS = [
  '1:1',
  '2:3',
  '3:2',
  '4:5',
  '5:4',
  '16:9',
  '9:16',
  '9:21',
  '21:9',
];
const FIREWORKS_SIZE_OPTIONS = [
  '640x1536',
  '768x1344',
  '832x1216',
  '896x1152',
  '1024x1024',
  '1152x896',
  '1216x832',
  '1344x768',
  '1536x640',
];
const XAI_ASPECT_RATIO_OPTIONS = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '2:1',
  '1:2',
  '19.5:9',
  '9:19.5',
  '20:9',
  '9:20',
  'auto',
];
const OPENAI_GPT_IMAGE_SIZE_OPTIONS = ['auto', '1024x1024', '1536x1024', '1024x1536'];
const OPENAI_DALLE_3_SIZE_OPTIONS = ['1024x1024', '1792x1024', '1024x1792'];
const OPENAI_DALLE_2_SIZE_OPTIONS = ['256x256', '512x512', '1024x1024'];
const PIXEL_SIZE_OPTIONS = [
  '512x512',
  '768x768',
  '1024x1024',
  '1536x1024',
  '1024x1536',
  '2048x1024',
  '1024x2048',
];
const FIREWORKS_SIZE_MODEL_IDS = new Set([
  'accounts/fireworks/models/playground-v2-5-1024px-aesthetic',
  'accounts/fireworks/models/japanese-stable-diffusion-xl',
  'accounts/fireworks/models/playground-v2-1024px-aesthetic',
  'accounts/fireworks/models/stable-diffusion-xl-1024-v1-0',
  'accounts/fireworks/models/SSD-1B',
]);

const createCapabilities = (
  overrides: Partial<ImageGenerationCapabilities> = {}
): ImageGenerationCapabilities => ({
  supportsCount: false,
  supportsSize: false,
  supportsAspectRatio: false,
  supportsSeed: false,
  supportsOpenAIOptions: false,
  supportsOpenAIBackgroundOptions: false,
  supportsOpenAIOutputOptions: false,
  supportsOpenAIStyleOptions: false,
  supportsOpenAIModerationOptions: false,
  supportsXaiOptions: false,
  supportsGoogleOptions: false,
  supportsGoogleVertexOptions: false,
  supportsTogetherOptions: false,
  supportsFireworksOptions: false,
  supportsDeepInfraOptions: false,
  supportsFalOptions: false,
  supportsReplicateOptions: false,
  supportsBlackForestLabsOptions: false,
  supportsProdiaOptions: false,
  supportsLumaOptions: false,
  maxCount: 1,
  sizeOptions: [],
  aspectRatioOptions: [],
  qualityOptions: [],
  ...overrides,
});

const cloneCapabilities = (
  capabilities: ImageGenerationCapabilities
): ImageGenerationCapabilities => ({
  ...capabilities,
  sizeOptions: [...capabilities.sizeOptions],
  aspectRatioOptions: [...capabilities.aspectRatioOptions],
  qualityOptions: [...capabilities.qualityOptions],
});

const EMPTY_CAPABILITIES = createCapabilities();

const IMAGE_SIZE_ONLY_CAPABILITIES = createCapabilities({
  supportsSize: true,
  sizeOptions: PIXEL_SIZE_OPTIONS,
});

const SIMPLE_PROVIDER_CAPABILITIES: Record<string, ImageGenerationCapabilities> = {
  openrouter: createCapabilities({
    supportsCount: true,
    supportsAspectRatio: true,
    supportsSeed: true,
    maxCount: 4,
    aspectRatioOptions: COMMON_ASPECT_RATIO_OPTIONS,
  }),
  together: createCapabilities({
    supportsCount: true,
    supportsSize: true,
    supportsSeed: true,
    supportsTogetherOptions: true,
    maxCount: 4,
    sizeOptions: PIXEL_SIZE_OPTIONS,
  }),
  deepinfra: createCapabilities({
    supportsCount: true,
    supportsSize: true,
    supportsSeed: true,
    supportsDeepInfraOptions: true,
    maxCount: 4,
    sizeOptions: PIXEL_SIZE_OPTIONS,
  }),
  fal: createCapabilities({
    supportsCount: true,
    supportsAspectRatio: true,
    supportsFalOptions: true,
    maxCount: 4,
    aspectRatioOptions: COMMON_ASPECT_RATIO_OPTIONS,
  }),
  replicate: createCapabilities({
    supportsCount: true,
    supportsAspectRatio: true,
    supportsReplicateOptions: true,
    maxCount: 4,
    aspectRatioOptions: COMMON_ASPECT_RATIO_OPTIONS,
  }),
  'black-forest-labs': createCapabilities({
    supportsCount: true,
    supportsAspectRatio: true,
    supportsBlackForestLabsOptions: true,
    maxCount: 4,
    aspectRatioOptions: COMMON_ASPECT_RATIO_OPTIONS,
  }),
  prodia: createCapabilities({
    supportsCount: true,
    supportsSize: true,
    supportsProdiaOptions: true,
    maxCount: 4,
    sizeOptions: PIXEL_SIZE_OPTIONS,
  }),
  'luma-ai': createCapabilities({
    supportsCount: true,
    supportsAspectRatio: true,
    supportsLumaOptions: true,
    maxCount: 4,
    aspectRatioOptions: COMMON_ASPECT_RATIO_OPTIONS,
  }),
  xai: createCapabilities({
    supportsCount: true,
    supportsAspectRatio: true,
    supportsXaiOptions: true,
    maxCount: 3,
    aspectRatioOptions: XAI_ASPECT_RATIO_OPTIONS,
    qualityOptions: ['low', 'medium', 'high'],
  }),
  minimax: createCapabilities({
    supportsCount: true,
    supportsAspectRatio: true,
    maxCount: 4,
    aspectRatioOptions: COMMON_ASPECT_RATIO_OPTIONS,
  }),
  glm: IMAGE_SIZE_ONLY_CAPABILITIES,
};

const isOpenAIGptImageModel = (modelName?: string): boolean => {
  const name = modelName?.trim() ?? '';
  return name.startsWith('gpt-image-') || name.startsWith('chatgpt-image-');
};

const isOpenAIDalle3Model = (modelName?: string): boolean => (modelName?.trim() ?? '') === 'dall-e-3';

const isGoogleGeminiImageModel = (modelName?: string): boolean => {
  return (modelName?.trim() ?? '').startsWith('gemini-');
};

const getOpenAICapabilities = (imageModelName?: string): ImageGenerationCapabilities => {
  const modelName = imageModelName?.trim() ?? '';
  const isGptImage = isOpenAIGptImageModel(modelName);
  const isDalle3 = isOpenAIDalle3Model(modelName);
  const sizeOptions =
    modelName === 'dall-e-3'
      ? OPENAI_DALLE_3_SIZE_OPTIONS
      : modelName === 'dall-e-2'
        ? OPENAI_DALLE_2_SIZE_OPTIONS
        : OPENAI_GPT_IMAGE_SIZE_OPTIONS;
  const qualityOptions: ImageGenerationQuality[] = isDalle3
    ? ['standard', 'hd']
    : isGptImage
      ? ['auto', 'low', 'medium', 'high']
      : [];

  return createCapabilities({
    supportsCount: true,
    supportsSize: true,
    supportsOpenAIOptions: qualityOptions.length > 0,
    supportsOpenAIBackgroundOptions: isGptImage,
    supportsOpenAIOutputOptions: isGptImage,
    supportsOpenAIStyleOptions: isDalle3,
    supportsOpenAIModerationOptions: isGptImage,
    maxCount: modelName === 'dall-e-3' ? 1 : 10,
    sizeOptions,
    qualityOptions,
  });
};

const getGoogleCapabilities = (imageModelName?: string): ImageGenerationCapabilities => {
  const isGemini = isGoogleGeminiImageModel(imageModelName);

  return createCapabilities({
    supportsCount: !isGemini,
    supportsAspectRatio: true,
    supportsSeed: isGemini,
    supportsGoogleOptions: !isGemini,
    maxCount: isGemini ? 1 : 4,
    aspectRatioOptions: isGemini
      ? GOOGLE_GEMINI_IMAGE_ASPECT_RATIO_OPTIONS
      : COMMON_ASPECT_RATIO_OPTIONS,
  });
};

const getGoogleVertexCapabilities = (imageModelName?: string): ImageGenerationCapabilities => {
  const isGemini = isGoogleGeminiImageModel(imageModelName);

  return createCapabilities({
    supportsCount: !isGemini,
    supportsAspectRatio: true,
    supportsSeed: true,
    supportsGoogleVertexOptions: !isGemini,
    maxCount: isGemini ? 1 : 4,
    aspectRatioOptions: isGemini
      ? GOOGLE_GEMINI_IMAGE_ASPECT_RATIO_OPTIONS
      : COMMON_ASPECT_RATIO_OPTIONS,
  });
};

const getFireworksCapabilities = (imageModelName?: string): ImageGenerationCapabilities => {
  const supportsSize = FIREWORKS_SIZE_MODEL_IDS.has(imageModelName?.trim() ?? '');

  return createCapabilities({
    supportsCount: true,
    supportsSize,
    supportsAspectRatio: !supportsSize,
    supportsSeed: true,
    supportsFireworksOptions: true,
    maxCount: 4,
    sizeOptions: supportsSize ? FIREWORKS_SIZE_OPTIONS : [],
    aspectRatioOptions: supportsSize ? [] : FIREWORKS_ASPECT_RATIO_OPTIONS,
  });
};

const DYNAMIC_PROVIDER_CAPABILITIES: Record<
  string,
  (imageModelName?: string) => ImageGenerationCapabilities
> = {
  openai: getOpenAICapabilities,
  google: getGoogleCapabilities,
  'google-vertex': getGoogleVertexCapabilities,
  fireworks: getFireworksCapabilities,
};

export const getImageGenerationCapabilities = (
  providerId: ProviderId,
  imageModelName?: string
): ImageGenerationCapabilities => {
  if (!supportsImageGenerationProvider(providerId)) {
    return cloneCapabilities(EMPTY_CAPABILITIES);
  }

  const capabilities =
    DYNAMIC_PROVIDER_CAPABILITIES[providerId]?.(imageModelName) ??
    SIMPLE_PROVIDER_CAPABILITIES[providerId] ??
    IMAGE_SIZE_ONLY_CAPABILITIES;

  return cloneCapabilities(capabilities);
};
