import { useCallback, useState } from 'react';
import { t } from '@/shared/utils/i18n';
import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import type { CustomProviderDraft } from '@/infrastructure/providers/runtime/providerFileMutations';
import type { ProviderTransport } from '@contracts/provider-config';

const DEFAULT_CUSTOM_PROVIDER_TRANSPORT: ProviderTransport = 'openai-compatible';

export const useCustomProviderDraft = ({
  onCreateCustomProvider,
}: {
  onCreateCustomProvider: (draft: CustomProviderDraft) => Promise<void>;
}) => {
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [customProviderId, setCustomProviderId] = useState('');
  const [customProviderLabel, setCustomProviderLabel] = useState('');
  const [customProviderTransport, setCustomProviderTransport] = useState<ProviderTransport>(
    DEFAULT_CUSTOM_PROVIDER_TRANSPORT
  );
  const [customProviderBaseUrl, setCustomProviderBaseUrl] = useState('');
  const [customProviderApiKey, setCustomProviderApiKey] = useState('');
  const [customProviderSystemPrompt, setCustomProviderSystemPrompt] = useState('');
  const [customProviderError, setCustomProviderError] = useState<string | null>(null);

  const resetCustomProviderDraft = useCallback(() => {
    setCustomProviderId('');
    setCustomProviderLabel('');
    setCustomProviderTransport(DEFAULT_CUSTOM_PROVIDER_TRANSPORT);
    setCustomProviderBaseUrl('');
    setCustomProviderApiKey('');
    setCustomProviderSystemPrompt('');
    setCustomProviderError(null);
  }, []);

  const toggleCreateProvider = useCallback(() => {
    if (isCreatingProvider) {
      resetCustomProviderDraft();
    } else {
      setCustomProviderError(null);
    }

    setIsCreatingProvider((value) => !value);
  }, [isCreatingProvider, resetCustomProviderDraft]);

  const createProvider = useCallback(async () => {
    const nextProviderId = customProviderId.trim().toLowerCase();
    const nextProviderLabel = customProviderLabel.trim();

    if (!nextProviderId) {
      setCustomProviderError(t('settings.modal.customProvider.error.idRequired'));
      return;
    }

    if (!/^[a-z0-9][a-z0-9-]*$/.test(nextProviderId)) {
      setCustomProviderError(t('settings.modal.customProvider.error.idInvalid'));
      return;
    }

    if (!nextProviderLabel) {
      setCustomProviderError(t('settings.modal.customProvider.error.labelRequired'));
      return;
    }

    if (listProviderIds().includes(nextProviderId)) {
      setCustomProviderError(t('settings.modal.customProvider.error.duplicate'));
      return;
    }

    if (!customProviderBaseUrl.trim()) {
      setCustomProviderError(t('settings.modal.customProvider.error.baseUrlRequired'));
      return;
    }

    setCustomProviderError(null);

    try {
      await onCreateCustomProvider({
        id: nextProviderId,
        label: nextProviderLabel,
        transport: customProviderTransport,
        baseUrl: customProviderBaseUrl.trim(),
        apiKey: customProviderApiKey.trim(),
        systemPrompt: customProviderSystemPrompt.trim(),
      });
      setIsCreatingProvider(false);
      resetCustomProviderDraft();
    } catch (error) {
      setCustomProviderError(
        error instanceof Error
          ? error.message
          : t('settings.modal.customProvider.error.createFailed')
      );
    }
  }, [
    customProviderApiKey,
    customProviderBaseUrl,
    customProviderId,
    customProviderLabel,
    customProviderSystemPrompt,
    customProviderTransport,
    onCreateCustomProvider,
    resetCustomProviderDraft,
  ]);

  return {
    isCreatingProvider,
    customProviderId,
    customProviderLabel,
    customProviderTransport,
    customProviderBaseUrl,
    customProviderApiKey,
    customProviderSystemPrompt,
    customProviderError,
    setCustomProviderId,
    setCustomProviderLabel,
    setCustomProviderTransport,
    setCustomProviderBaseUrl,
    setCustomProviderApiKey,
    setCustomProviderSystemPrompt,
    toggleCreateProvider,
    createProvider,
  };
};
