import { ProviderId } from '@/shared/types/chat';
import type {
  OpenAdapterToolKey,
  OpenAdapterToolSettings,
} from '@/infrastructure/providers/openadapterToolConfig';
import type { OpenAIRequestMode, ProviderModelItem } from '@/infrastructure/providers/types';
import type { ImageGenerationSettings } from '@/infrastructure/providers/imageGenerationSettings';
import type { CustomProviderDraft } from '@/infrastructure/providers/runtime/providerFileMutations';
import type { DropdownOption } from '@/shared/ui';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';
import type { ReactNode } from 'react';

export type CustomHeadersSectionProps = {
  customHeaders: Array<{ key: string; value: string }>;
  validationIssuesByField: Record<string, SettingsValidationIssue[]>;
  onAddCustomHeader: () => void;
  onSetCustomHeaderKey: (index: number, value: string) => void;
  onSetCustomHeaderValue: (index: number, value: string) => void;
  onRemoveCustomHeader: (index: number) => void;
};

export type RegionSelectorProps = {
  isCnRegion: boolean;
  isIntlRegion: boolean;
  onSetRegionCn: () => void;
  onSetRegionIntl: () => void;
};

export type DefaultProviderCardProps = {
  providerId: ProviderId;
  currentChatProviderId: ProviderId;
  defaultProviderId: ProviderId;
  providerOptions: DropdownOption[];
  mutationsLockedReason?: string | null;
  onSetDefaultProvider: () => void;
};

export type ModelSelectorProps = {
  providerId: ProviderId;
  providerOptions: DropdownOption[];
  providerLabel?: string;
  providerActions?: ReactNode;
  modelName: string;
  availableModels: ProviderModelItem[];
  isFetchingModels: boolean;
  modelFetchError?: string | null;
  onProviderChange: (providerId: ProviderId) => void;
  onModelNameChange: (value: string) => void;
  onFetchModels: () => Promise<void>;
};

export type ImageModelSelectorProps = {
  providerId: ProviderId;
  imageModelName: string;
  availableImageModels: ProviderModelItem[];
  isFetchingImageModels: boolean;
  imageModelFetchError?: string | null;
  onImageModelNameChange: (value: string) => void;
  onFetchImageModels: () => Promise<void>;
};

export type ImageGenerationTabProps = ImageModelSelectorProps & {
  imageGeneration: ImageGenerationSettings;
  mutationsLockedReason?: string | null;
  onImageGenerationChange: (value: ImageGenerationSettings) => void;
};

export type OpenAdapterToolsSectionProps = {
  openAdapterTools: OpenAdapterToolSettings;
  mutationsLockedReason?: string | null;
  onSetOpenAdapterToolEnabled: (key: OpenAdapterToolKey, value: boolean) => void;
};

export type CustomHeaderRowProps = {
  header: { key: string; value: string };
  index: number;
  issues?: SettingsValidationIssue[];
  onSetCustomHeaderKey: (index: number, value: string) => void;
  onSetCustomHeaderValue: (index: number, value: string) => void;
  onRemoveCustomHeader: (index: number) => void;
};

export type ProviderTabProps = {
  providerId: ProviderId;
  currentChatProviderId: ProviderId;
  defaultProviderId: ProviderId;
  providerOptions: DropdownOption[];
  modelName: string;
  systemPrompt: string;
  imageModelName: string;
  apiKey: string;
  requestMode?: OpenAIRequestMode;
  baseUrl?: string;
  customHeaders: Array<{ key: string; value: string }>;
  openAdapterTools: OpenAdapterToolSettings;
  providerConfigJsonText: string;
  showApiKey: boolean;
  supportsRequestMode?: boolean;
  supportsBaseUrl?: boolean;
  supportsCustomHeaders?: boolean;
  supportsRegion?: boolean;
  availableModels: ProviderModelItem[];
  availableImageModels: ProviderModelItem[];
  isFetchingModels: boolean;
  isFetchingImageModels: boolean;
  modelFetchError?: string | null;
  imageModelFetchError?: string | null;
  isOfficialProvider?: boolean;
  mutationsLockedReason?: string | null;
  validationIssuesByField: Record<string, SettingsValidationIssue[]>;
  onProviderChange: (providerId: ProviderId) => void;
  onSetDefaultProvider: () => void;
  onModelNameChange: (value: string) => void;
  onSystemPromptChange: (value: string) => void;
  onImageModelNameChange: (value: string) => void;
  onImageGenerationChange: (value: ImageGenerationSettings) => void;
  onFetchModels: () => Promise<void>;
  onFetchImageModels: () => Promise<void>;
  onApiKeyChange: (value: string) => void;
  onRequestModeChange: (value: OpenAIRequestMode) => void;
  onToggleApiKeyVisibility: () => void;
  onClearApiKey: () => void;
  onBaseUrlChange: (value: string) => void;
  onProviderConfigJsonTextChange: (value: string) => void;
  onAddCustomHeader: () => void;
  onSetCustomHeaderKey: (index: number, value: string) => void;
  onSetCustomHeaderValue: (index: number, value: string) => void;
  onRemoveCustomHeader: (index: number) => void;
  onSetRegionBaseUrl: (region: 'intl' | 'cn') => void;
  onSetOpenAdapterToolEnabled: (key: OpenAdapterToolKey, value: boolean) => void;
};

export type CustomProviderTabProps = ProviderTabProps & {
  providerSource?: 'builtin' | 'custom';
  onCreateCustomProvider: (draft: CustomProviderDraft) => Promise<void>;
  onDeleteProvider: () => Promise<void>;
};
