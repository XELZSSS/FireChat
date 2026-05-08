import { memo } from 'react';
import type { ChatGeneratedImage } from '@/shared/types/chat';
import { GENERATED_IMAGE_CARD_CLASS } from '@client/features/chat/presentation/chatBubbleParts/constants';

const buildGeneratedImageDataUrl = (image: ChatGeneratedImage): string =>
  `data:${image.mimeType};base64,${image.data}`;

const buildGeneratedImageMeta = (image: ChatGeneratedImage): string => {
  const parts = [image.size, image.quality, image.background].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );

  return parts.join(' · ');
};

export const GeneratedImagesSection = memo(function GeneratedImagesSection({
  images,
}: {
  images: ChatGeneratedImage[];
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-3">
      {images.map((image, index) => {
        const meta = buildGeneratedImageMeta(image);
        return (
          <div key={image.id} className={GENERATED_IMAGE_CARD_CLASS}>
            <img
              src={buildGeneratedImageDataUrl(image)}
              alt={`Generated image ${index + 1}`}
              className="block h-auto w-full bg-[var(--bg-2)] object-cover"
            />
            {meta ? (
              <div className="space-y-2 px-3.5 py-3">
                <div className="text-[10px] tracking-[0.02em] text-[var(--ink-3)]">{meta}</div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
});
