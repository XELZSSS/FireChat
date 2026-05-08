import { t } from '@/shared/utils/i18n';

export type ImageGenerationOption = {
  value: string;
  label: string;
};

const COUNT_OPTIONS: ImageGenerationOption[] = Array.from({ length: 10 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: value };
});

export const buildDimensionModeOptions = (): ImageGenerationOption[] => [
  { value: 'size', label: t('settings.imageGeneration.dimension.size') },
  { value: 'aspectRatio', label: t('settings.imageGeneration.dimension.aspectRatio') },
];

export const buildQualityOptions = (): ImageGenerationOption[] => [
  { value: 'auto', label: t('settings.imageGeneration.option.auto') },
  { value: 'standard', label: t('settings.imageGeneration.option.standard') },
  { value: 'low', label: t('settings.imageGeneration.option.low') },
  { value: 'medium', label: t('settings.imageGeneration.option.medium') },
  { value: 'high', label: t('settings.imageGeneration.option.high') },
  { value: 'hd', label: 'HD' },
];

export const buildBackgroundOptions = (): ImageGenerationOption[] => [
  { value: 'auto', label: t('settings.imageGeneration.option.auto') },
  { value: 'opaque', label: t('settings.imageGeneration.option.opaque') },
  { value: 'transparent', label: t('settings.imageGeneration.option.transparent') },
];

export const OUTPUT_FORMAT_OPTIONS: ImageGenerationOption[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
];

export const XAI_RESOLUTION_OPTIONS: ImageGenerationOption[] = [
  { value: '1k', label: '1K' },
  { value: '2k', label: '2K' },
];

export const GOOGLE_PERSON_OPTIONS: ImageGenerationOption[] = [
  { value: 'dont_allow', label: t('settings.imageGeneration.person.dontAllow') },
  { value: 'allow_adult', label: t('settings.imageGeneration.person.allowAdult') },
  { value: 'allow_all', label: t('settings.imageGeneration.person.allowAll') },
];

export const PRODIA_STYLE_PRESET_OPTIONS: ImageGenerationOption[] = [
  { value: 'none', label: t('settings.imageGeneration.option.none') },
  { value: '3d-model', label: '3D Model' },
  { value: 'analog-film', label: 'Analog Film' },
  { value: 'anime', label: 'Anime' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'comic-book', label: 'Comic Book' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'enhance', label: 'Enhance' },
  { value: 'fantasy-art', label: 'Fantasy Art' },
  { value: 'isometric', label: 'Isometric' },
  { value: 'line-art', label: 'Line Art' },
  { value: 'low-poly', label: 'Low Poly' },
  { value: 'neon-punk', label: 'Neon Punk' },
  { value: 'origami', label: 'Origami' },
  { value: 'photographic', label: 'Photographic' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'texture', label: 'Texture' },
  { value: 'craft-clay', label: 'Craft Clay' },
];

export const LUMA_REFERENCE_TYPE_OPTIONS: ImageGenerationOption[] = [
  { value: 'none', label: t('settings.imageGeneration.option.none') },
  { value: 'image', label: 'Image' },
  { value: 'style', label: 'Style' },
  { value: 'character', label: 'Character' },
  { value: 'modify_image', label: 'Modify Image' },
];

export const BLACK_FOREST_LABS_OUTPUT_FORMAT_OPTIONS: ImageGenerationOption[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
];

export const OPENAI_STYLE_OPTIONS: ImageGenerationOption[] = [
  { value: 'none', label: t('settings.imageGeneration.option.none') },
  { value: 'vivid', label: t('settings.imageGeneration.option.vivid') },
  { value: 'natural', label: t('settings.imageGeneration.option.natural') },
];

export const OPENAI_MODERATION_OPTIONS: ImageGenerationOption[] = [
  { value: 'none', label: t('settings.imageGeneration.option.none') },
  { value: 'auto', label: t('settings.imageGeneration.option.auto') },
  { value: 'low', label: t('settings.imageGeneration.option.low') },
];

export const toCountOptions = (maxCount: number): ImageGenerationOption[] =>
  COUNT_OPTIONS.slice(0, maxCount);

export const toValueOptions = (values: string[]): ImageGenerationOption[] =>
  values.map((value) => ({ value, label: value === 'auto' ? 'Auto' : value.replace('x', ' x ') }));

export const getDropdownValue = (value: string, options: ImageGenerationOption[]): string =>
  options.some((option) => option.value === value) ? value : (options[0]?.value ?? value);
