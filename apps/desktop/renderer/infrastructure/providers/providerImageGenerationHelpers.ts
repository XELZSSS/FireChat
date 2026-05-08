import type { ChatGeneratedImage } from '@/shared/types/chat';

export type GeneratedImageMetadata = Partial<
  Pick<ChatGeneratedImage, 'size' | 'quality' | 'background' | 'outputFormat'>
>;

export const trimText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

export const createGeneratedImageId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `generated-image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizeGeneratedImages = ({
  model,
  metadata,
  images,
}: {
  model: string;
  metadata?: GeneratedImageMetadata;
  images: Array<{ base64: string; mediaType: string }>;
}): ChatGeneratedImage[] => {
  return images.flatMap((image) => {
    const data = trimText(image.base64);
    const mimeType = trimText(image.mediaType);

    if (!data || !mimeType) {
      return [];
    }

    return [
      {
        id: createGeneratedImageId(),
        data,
        mimeType,
        model,
        ...metadata,
      },
    ];
  });
};
