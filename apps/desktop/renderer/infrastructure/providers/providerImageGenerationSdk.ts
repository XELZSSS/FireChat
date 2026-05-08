import { generateImage } from 'ai';
import { createBlackForestLabs } from '@ai-sdk/black-forest-labs';
import { createDeepInfra } from '@ai-sdk/deepinfra';
import { createFal } from '@ai-sdk/fal';
import { createFireworks } from '@ai-sdk/fireworks';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex/edge';
import { createLuma } from '@ai-sdk/luma';
import { createOpenAI } from '@ai-sdk/openai';
import { createProdia } from '@ai-sdk/prodia';
import { createReplicate } from '@ai-sdk/replicate';
import { createTogetherAI } from '@ai-sdk/togetherai';
import { createXai } from '@ai-sdk/xai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createZhipu } from 'zhipu-ai-provider';
import type { ProviderId } from '@/shared/types/chat';
import { normalizeHeaderRecord } from '@/infrastructure/providers/aiSdkProviderMessages';
import {
  getDefaultXaiBaseUrl,
  resolveBaseUrlWithDefault,
} from '@/infrastructure/providers/config/baseUrl';
import {
  normalizeGeneratedImages,
  trimText,
  type GeneratedImageMetadata,
} from '@/infrastructure/providers/providerImageGenerationHelpers';
import type { GeneratedImageToolOutput } from '@/infrastructure/providers/providerImageGenerationTypes';

export const generateWithSdkModel = async ({
  prompt,
  count,
  aspectRatio,
  size,
  seed,
  promptImages,
  providerOptions,
  metadata,
  modelName,
  model,
}: {
  prompt: string;
  count: number;
  aspectRatio?: `${number}:${number}`;
  size?: `${number}x${number}`;
  seed?: number;
  promptImages?: string[];
  providerOptions?: Record<string, Record<string, unknown>>;
  metadata?: GeneratedImageMetadata;
  modelName: string;
  model: Parameters<typeof generateImage>[0]['model'];
}): Promise<GeneratedImageToolOutput> => {
  const result = await generateImage({
    model,
    prompt:
      promptImages && promptImages.length > 0
        ? {
            text: prompt,
            images: promptImages,
          }
        : prompt,
    n: count,
    aspectRatio,
    size,
    seed,
    providerOptions: providerOptions as any,
    maxRetries: 0,
  });

  return {
    generatedImages: normalizeGeneratedImages({
      model: modelName,
      metadata,
      images: result.images.map((image) => ({
        base64: image.base64,
        mediaType: image.mediaType,
      })),
    }),
  };
};

export const createImageModel = ({
  providerId,
  imageModelName,
  apiKey,
  baseUrl,
  customHeaders,
  fetcher,
}: {
  providerId: ProviderId;
  imageModelName: string;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  fetcher: typeof fetch;
}) => {
  const headers = normalizeHeaderRecord(customHeaders);

  switch (providerId) {
    case 'openai':
      return createOpenAI({
        apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).image(imageModelName);
    case 'google':
      return createGoogleGenerativeAI({
        apiKey,
        baseURL: trimText(baseUrl),
        fetch: fetcher,
      }).image(imageModelName);
    case 'google-vertex':
      return createVertex({
        apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).image(imageModelName);
    case 'openrouter':
      return createOpenRouter({
        apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).imageModel(imageModelName);
    case 'together':
      return createTogetherAI({
        apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).image(imageModelName);
    case 'fireworks':
      return createFireworks({
        apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).image(imageModelName);
    case 'deepinfra':
      return createDeepInfra({
        apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).image(imageModelName);
    case 'fal':
      return createFal({
        apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).image(imageModelName);
    case 'replicate':
      return createReplicate({
        apiToken: apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).image(imageModelName);
    case 'black-forest-labs':
      return createBlackForestLabs({
        apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).image(imageModelName);
    case 'prodia':
      return createProdia({
        apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).image(imageModelName);
    case 'luma-ai':
      return createLuma({
        apiKey,
        baseURL: trimText(baseUrl),
        headers,
        fetch: fetcher,
      }).image(imageModelName);
    case 'xai':
      return createXai({
        apiKey,
        baseURL: resolveBaseUrlWithDefault(trimText(baseUrl), getDefaultXaiBaseUrl),
        fetch: fetcher,
      }).image(imageModelName);
    case 'glm':
      return createZhipu({
        apiKey,
        baseURL: trimText(baseUrl),
        fetch: fetcher,
      }).imageModel(imageModelName);
    default:
      return undefined;
  }
};
