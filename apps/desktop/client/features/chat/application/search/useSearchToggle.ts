import { useEffect } from 'react';
import type { ChatService } from '@client/features/chat/application/chatService';
import { useProviderTogglePreference } from '@client/features/settings/application/useProviderTogglePreference';

type UseSearchToggleOptions = {
  chatService: ChatService;
  searchAvailable: boolean;
  currentProviderId: string;
};

const resolveRuntimeSearchEnabled = (searchEnabled: boolean, searchAvailable: boolean): boolean => {
  return searchAvailable ? searchEnabled : false;
};

export const useSearchToggle = ({
  chatService,
  searchAvailable,
  currentProviderId,
}: UseSearchToggleOptions) => {
  const { enabled: preferredSearchEnabled, setEnabled: setSearchEnabled } =
    useProviderTogglePreference({
      storageKey: 'searchEnabled',
      currentProviderId,
      defaultValue: false,
    });

  const searchEnabled = resolveRuntimeSearchEnabled(preferredSearchEnabled, searchAvailable);

  useEffect(() => {
    chatService.setSearchEnabled(searchEnabled);
  }, [chatService, currentProviderId, searchEnabled]);

  return { searchEnabled, setSearchEnabled };
};
