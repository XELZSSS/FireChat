export type ImageGenerationDimensionMode = 'size' | 'aspectRatio';
export type ImageGenerationQuality = 'auto' | 'standard' | 'low' | 'medium' | 'high' | 'hd';
export type ImageGenerationBackground = 'auto' | 'opaque' | 'transparent';
export type ImageGenerationOutputFormat = 'png' | 'jpeg' | 'webp';
export type ImageGenerationXaiResolution = '1k' | '2k';
export type ImageGenerationGooglePersonGeneration = 'dont_allow' | 'allow_adult' | 'allow_all';
export type ImageGenerationOpenAIStyle = 'none' | 'vivid' | 'natural';
export type ImageGenerationOpenAIModeration = 'none' | 'auto' | 'low';
export type ImageGenerationProdiaStylePreset =
  | 'none'
  | '3d-model'
  | 'analog-film'
  | 'anime'
  | 'cinematic'
  | 'comic-book'
  | 'digital-art'
  | 'enhance'
  | 'fantasy-art'
  | 'isometric'
  | 'line-art'
  | 'low-poly'
  | 'neon-punk'
  | 'origami'
  | 'photographic'
  | 'pixel-art'
  | 'texture'
  | 'craft-clay';
export type ImageGenerationLumaReferenceType =
  | 'none'
  | 'image'
  | 'style'
  | 'character'
  | 'modify_image';
export type ImageGenerationBlackForestLabsOutputFormat = 'png' | 'jpeg';

export type ImageGenerationSettings = {
  count: number;
  dimensionMode: ImageGenerationDimensionMode;
  size: string;
  aspectRatio: string;
  seed?: number;
  quality: ImageGenerationQuality;
  background: ImageGenerationBackground;
  outputFormat: ImageGenerationOutputFormat;
  outputCompression: number;
  openAIStyle: ImageGenerationOpenAIStyle;
  openAIModeration: ImageGenerationOpenAIModeration;
  openAIUser: string;
  xaiResolution: ImageGenerationXaiResolution;
  googlePersonGeneration: ImageGenerationGooglePersonGeneration;
  togetherSteps?: number;
  togetherGuidance?: number;
  togetherNegativePrompt: string;
  togetherDisableSafetyChecker: boolean;
  fireworksSteps?: number;
  fireworksCfgScale?: number;
  fireworksNegativePrompt: string;
  deepInfraNumInferenceSteps?: number;
  deepInfraGuidanceScale?: number;
  deepInfraNegativePrompt: string;
  falPromptOptimizer: boolean;
  falEnableSafetyChecker: boolean;
  falSafetyTolerance?: number;
  falSyncMode: boolean;
  replicateMaxWaitTimeInSeconds?: number;
  replicateGuidanceScale?: number;
  replicateNumInferenceSteps?: number;
  replicateNegativePrompt: string;
  replicateOutputFormat: ImageGenerationOutputFormat;
  replicateOutputQuality?: number;
  replicateStrength?: number;
  blackForestLabsImagePrompt: string;
  blackForestLabsImagePromptStrength?: number;
  blackForestLabsInputImages: string;
  blackForestLabsSteps?: number;
  blackForestLabsGuidance?: number;
  blackForestLabsOutputFormat: ImageGenerationBlackForestLabsOutputFormat;
  blackForestLabsPromptUpsampling: boolean;
  blackForestLabsRaw: boolean;
  blackForestLabsSafetyTolerance?: number;
  blackForestLabsWebhookUrl: string;
  blackForestLabsWebhookSecret: string;
  blackForestLabsPollIntervalMillis?: number;
  blackForestLabsPollTimeoutMillis?: number;
  prodiaSteps?: number;
  prodiaStylePreset: ImageGenerationProdiaStylePreset;
  prodiaLoras: string;
  prodiaProgressive: boolean;
  lumaReferenceType: ImageGenerationLumaReferenceType;
  lumaReferenceImages: string;
  lumaReferenceWeight?: number;
  lumaReferenceId: string;
  lumaPollIntervalMillis?: number;
  lumaMaxPollAttempts?: number;
};
