import { ProviderId } from '@/shared/types/chat';
import { PROVIDER_CONFIGS } from '@/infrastructure/providers/config/providerConfig';
import type { ProviderCapabilities } from '@/infrastructure/providers/config/providerManifest';

const DEFAULT_CAPABILITIES: ProviderCapabilities = {
  supportsTavily: false,
  supportsBaseUrl: false,
  supportsCustomHeaders: false,
  supportsRegion: false,
  supportsReasoningToggle: false,
  supportsRequestMode: false,
};

export const getProviderCapabilities = (providerId: ProviderId): ProviderCapabilities => {
  return PROVIDER_CONFIGS[providerId]?.capabilities ?? DEFAULT_CAPABILITIES;
};

export const supportsProviderTavily = (providerId: ProviderId): boolean => {
  return getProviderCapabilities(providerId).supportsTavily;
};

export const supportsProviderRequestMode = (providerId: ProviderId): boolean => {
  return Boolean(getProviderCapabilities(providerId).supportsRequestMode);
};
