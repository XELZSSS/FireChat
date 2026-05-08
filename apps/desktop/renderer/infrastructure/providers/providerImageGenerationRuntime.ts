import type { ChatGeneratedImage, ProviderId } from '@/shared/types/chat';
import type { ProviderResponseMetadata } from '@/infrastructure/providers/types';
import { getDefaultProviderImageModel } from '@/infrastructure/providers/providerImageCatalog';
import {
  getDefaultImageGenerationSettings,
  resolveImageGenerationRuntimeSettings,
  type ImageGenerationSettings,
} from '@/infrastructure/providers/imageGenerationSettings';
import { trimText } from '@/infrastructure/providers/providerImageGenerationHelpers';
import { generateWithMinimax } from '@/infrastructure/providers/providerImageGenerationMinimax';
import {
  createImageModel,
  generateWithSdkModel,
} from '@/infrastructure/providers/providerImageGenerationSdk';
import type { GeneratedImageToolOutput } from '@/infrastructure/providers/providerImageGenerationTypes';

export type { GeneratedImageToolOutput } from '@/infrastructure/providers/providerImageGenerationTypes';

export const IMAGE_GENERATION_TOOL_NAME = 'generate_image';

type StaticToolResultRecord = {
  toolName?: unknown;
  output?: unknown;
};

export type StaticToolResultSource = {
  staticToolResults: PromiseLike<unknown>;
};

export type ImageGenerationToolContext = {
  providerId: ProviderId;
  imageModelName?: string;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  imageGeneration?: ImageGenerationSettings;
  fetcher?: typeof fetch;
};

export type ImageGenerationToolInput = {
  prompt?: string;
  aspectRatio?: `${number}:${number}`;
  size?: `${number}x${number}`;
  seed?: number;
  count?: number;
};

export const resolveImageModelName = (
  providerId: ProviderId,
  imageModelName?: string
): string | undefined => {
  return trimText(imageModelName) ?? getDefaultProviderImageModel(providerId);
};

const resolveImageCount = (count?: number): number => {
  return typeof count === 'number' && Number.isFinite(count)
    ? Math.min(Math.max(Math.trunc(count), 1), 10)
    : 1;
};

export const executeImageGeneration = async ({
  input,
  resolvedImageModelName,
  providerId,
  apiKey,
  baseUrl,
  customHeaders,
  imageGeneration,
  fetcher,
}: ImageGenerationToolContext & {
  input?: ImageGenerationToolInput;
  resolvedImageModelName: string;
}): Promise<GeneratedImageToolOutput> => {
  const prompt = trimText(input?.prompt);
  if (!prompt) {
    throw new Error('Missing image prompt.');
  }

  const runtimeSettings = resolveImageGenerationRuntimeSettings(
    providerId,
    resolvedImageModelName,
    imageGeneration ?? getDefaultImageGenerationSettings()
  );
  const count = runtimeSettings.capabilities.supportsCount
    ? resolveImageCount(input?.count ?? runtimeSettings.count)
    : 1;
  const aspectRatio = runtimeSettings.capabilities.supportsAspectRatio
    ? (trimText(input?.aspectRatio) ?? runtimeSettings.aspectRatio)
    : undefined;
  const size = runtimeSettings.capabilities.supportsSize
    ? (trimText(input?.size) ?? runtimeSettings.size)
    : undefined;
  const seed = runtimeSettings.capabilities.supportsSeed
    ? typeof input?.seed === 'number'
      ? input.seed
      : runtimeSettings.seed
    : undefined;

  if (providerId === 'minimax') {
    return generateWithMinimax({
      prompt,
      count,
      aspectRatio,
      imageModelName: resolvedImageModelName,
      metadata: runtimeSettings.metadata,
      apiKey,
      baseUrl,
      customHeaders,
      fetcher,
    });
  }

  const model = createImageModel({
    providerId,
    imageModelName: resolvedImageModelName,
    apiKey: trimText(apiKey) ?? '',
    baseUrl,
    customHeaders: customHeaders ?? [],
    fetcher: fetcher ?? fetch,
  });

  if (!model) {
    throw new Error(`Provider ${providerId} does not support image generation.`);
  }

  return generateWithSdkModel({
    prompt,
    count,
    aspectRatio: aspectRatio as `${number}:${number}` | undefined,
    size: size as `${number}x${number}` | undefined,
    seed,
    promptImages: runtimeSettings.promptImages,
    providerOptions: runtimeSettings.providerOptions,
    metadata: runtimeSettings.metadata,
    modelName: resolvedImageModelName,
    model,
  });
};

export const extractGeneratedImagesFromStaticToolResults = (
  toolResults: StaticToolResultRecord[]
): ChatGeneratedImage[] => {
  return toolResults.flatMap((toolResult) => {
    if (toolResult.toolName !== IMAGE_GENERATION_TOOL_NAME) {
      return [];
    }

    const output = toolResult.output as GeneratedImageToolOutput | undefined;
    return Array.isArray(output?.generatedImages) ? output.generatedImages : [];
  });
};

export const buildGeneratedImagesMetadataFromStreamResult = async (
  result: StaticToolResultSource
): Promise<Pick<ProviderResponseMetadata, 'generatedImages'> | undefined> => {
  const toolResults = await result.staticToolResults;
  const generatedImages = Array.isArray(toolResults)
    ? extractGeneratedImagesFromStaticToolResults(toolResults)
    : [];

  return generatedImages.length > 0 ? { generatedImages } : undefined;
};
