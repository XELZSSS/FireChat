import { useState } from 'react';
import { t } from '@/shared/utils/i18n';
import {
  parseInterfaceLayoutConfigText,
  stringifyInterfaceLayoutConfig,
} from '@client/features/settings/infrastructure/interfaceLayoutConfig';

export const useInterfaceJsonModal = ({
  interfaceLayoutConfigText,
  isInteractionLocked,
  onInterfaceLayoutConfigTextChange,
}: {
  interfaceLayoutConfigText: string;
  isInteractionLocked: boolean;
  onInterfaceLayoutConfigTextChange: (value: string) => void;
}) => {
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [interfaceJsonDraft, setInterfaceJsonDraft] = useState(interfaceLayoutConfigText);
  const [interfaceJsonDraftError, setInterfaceJsonDraftError] = useState<string | null>(null);

  const handleOpenJsonModal = () => {
    if (isInteractionLocked) {
      return;
    }

    setInterfaceJsonDraft(interfaceLayoutConfigText);
    setInterfaceJsonDraftError(null);
    setIsJsonModalOpen(true);
  };

  const handleCloseJsonModal = () => {
    setIsJsonModalOpen(false);
    setInterfaceJsonDraftError(null);
  };

  const handleJsonDraftChange = (value: string) => {
    setInterfaceJsonDraft(value);
    setInterfaceJsonDraftError(null);
  };

  const handleSaveJsonModal = () => {
    if (isInteractionLocked) {
      return;
    }

    try {
      const parsedConfig = parseInterfaceLayoutConfigText(interfaceJsonDraft);
      onInterfaceLayoutConfigTextChange(stringifyInterfaceLayoutConfig(parsedConfig));
      setIsJsonModalOpen(false);
      setInterfaceJsonDraftError(null);
    } catch {
      setInterfaceJsonDraftError(t('settings.validation.options.interfaceLayout.invalid'));
    }
  };

  return {
    handleCloseJsonModal,
    handleJsonDraftChange,
    handleOpenJsonModal,
    handleSaveJsonModal,
    interfaceJsonDraft,
    interfaceJsonDraftError,
    isJsonModalOpen,
  };
};
