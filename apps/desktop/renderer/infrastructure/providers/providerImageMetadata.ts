import type { ProviderId } from '@/shared/types/chat';
import type { ProviderModelItem } from '@/infrastructure/providers/types';

export const IMAGE_GENERATION_PROVIDER_IDS: ProviderId[] = [
  'openai',
  'google',
  'google-vertex',
  'openrouter',
  'together',
  'fireworks',
  'deepinfra',
  'xai',
  'glm',
  'minimax',
  'fal',
  'replicate',
  'black-forest-labs',
  'prodia',
  'luma-ai',
];

export const IMAGE_GENERATION_PROVIDER_ID_SET = new Set<ProviderId>(IMAGE_GENERATION_PROVIDER_IDS);

export const IMAGE_ONLY_PROVIDER_IDS: ProviderId[] = [
  'fal',
  'replicate',
  'black-forest-labs',
  'prodia',
  'luma-ai',
];

export const IMAGE_ONLY_PROVIDER_ID_SET = new Set<ProviderId>(IMAGE_ONLY_PROVIDER_IDS);

export const STATIC_IMAGE_MODELS: Partial<Record<ProviderId, ProviderModelItem[]>> = {
  fal: [{ id: 'fal-ai/flux/dev', name: 'FLUX.1 Dev' }],
  replicate: [{ id: 'black-forest-labs/flux-schnell', name: 'FLUX.1 Schnell' }],
  'black-forest-labs': [{ id: 'flux-pro-1.1', name: 'FLUX 1.1 Pro' }],
  prodia: [
    {
      id: 'inference.flux-fast.schnell.txt2img.v2',
      name: 'FLUX Fast Schnell',
    },
  ],
  'luma-ai': [{ id: 'photon-flash-1', name: 'Photon Flash 1' }],
};

export const supportsImageGenerationProvider = (providerId: ProviderId): boolean =>
  IMAGE_GENERATION_PROVIDER_ID_SET.has(providerId);

export const isImageOnlyProviderId = (providerId: string): boolean =>
  IMAGE_ONLY_PROVIDER_ID_SET.has(providerId as ProviderId);

export const getStaticImageModelItems = (providerId: ProviderId): ProviderModelItem[] =>
  STATIC_IMAGE_MODELS[providerId] ?? [];
