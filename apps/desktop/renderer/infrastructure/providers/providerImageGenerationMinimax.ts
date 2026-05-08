import type { GeneratedImageToolOutput } from '@/infrastructure/providers/providerImageGenerationTypes';
import { normalizeHeaderRecord } from '@/infrastructure/providers/aiSdkProviderMessages';
import { getDefaultMinimaxBaseUrl } from '@/infrastructure/providers/config/baseUrl';
import {
  createGeneratedImageId,
  trimText,
  type GeneratedImageMetadata,
} from '@/infrastructure/providers/providerImageGenerationHelpers';

export const generateWithMinimax = async ({
  prompt,
  count,
  aspectRatio,
  imageModelName,
  metadata,
  apiKey,
  baseUrl,
  customHeaders,
  fetcher = fetch,
}: {
  prompt: string;
  count: number;
  aspectRatio?: string;
  imageModelName: string;
  metadata?: GeneratedImageMetadata;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Array<{ key: string; value: string }>;
  fetcher?: typeof fetch;
}): Promise<GeneratedImageToolOutput> => {
  const resolvedApiKey = trimText(apiKey);
  if (!resolvedApiKey) {
    throw new Error('Missing MINIMAX_API_KEY');
  }

  const headers = new Headers({
    Authorization: `Bearer ${resolvedApiKey}`,
    'Content-Type': 'application/json',
  });
  Object.entries(normalizeHeaderRecord(customHeaders)).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetcher(
    `${(trimText(baseUrl) ?? getDefaultMinimaxBaseUrl()).replace(/\/+$/, '')}/image_generation`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: imageModelName,
        prompt,
        aspect_ratio: aspectRatio,
        response_format: 'base64',
        n: count,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`MiniMax image generation failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    data?: {
      image_base64?: unknown;
    };
  };
  const images = Array.isArray(payload.data?.image_base64)
    ? payload.data?.image_base64
    : payload.data?.image_base64
      ? [payload.data.image_base64]
      : [];

  return {
    generatedImages: images.flatMap((item) => {
      const data = trimText(item);
      if (!data) {
        return [];
      }

      return [
        {
          id: createGeneratedImageId(),
          data,
          mimeType: 'image/jpeg',
          model: imageModelName,
          ...metadata,
        },
      ];
    }),
  };
};
