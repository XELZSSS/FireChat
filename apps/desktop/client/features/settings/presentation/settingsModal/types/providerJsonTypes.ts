import type { OpenAIRequestMode } from '@/infrastructure/providers/types';
import type { ImageGenerationSettings } from '@/infrastructure/providers/imageGenerationSettings';

export type ProviderJsonStateActions = {
  onModelNameChange: (value: string) => void;
  onSystemPromptChange: (value: string) => void;
  onImageModelNameChange: (value: string) => void;
  onImageGenerationChange: (value: ImageGenerationSettings) => void;
  onApiKeyChange: (value: string) => void;
  onRequestModeChange: (value: OpenAIRequestMode) => void;
  onBaseUrlChange: (value: string) => void;
  onAddCustomHeader: () => void;
  onSetCustomHeaderKey: (index: number, value: string) => void;
  onSetCustomHeaderValue: (index: number, value: string) => void;
  onRemoveCustomHeader: (index: number) => void;
  onProviderConfigJsonTextChange: (value: string) => void;
};