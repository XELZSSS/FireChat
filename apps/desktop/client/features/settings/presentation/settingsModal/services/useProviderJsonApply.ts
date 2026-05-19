import { useCallback } from 'react';
import type { ProviderId } from '@/shared/types/chat';
import {
  createCustomProviderDraftFromJson,
  parseProviderJsonText,
} from '@client/features/settings/infrastructure/providerJsonConfig';
import { applyProviderJsonToFormState } from '@client/features/settings/presentation/settingsModal/state/providerJsonState';
import type { CustomProviderDraft } from '@/infrastructure/providers/runtime/providerFileMutations';
import type { ProviderJsonStateActions } from '@client/features/settings/presentation/settingsModal/types/providerJsonTypes';

type UseProviderJsonApplyOptions = {
  providerId: ProviderId;
  currentHeaders: Array<{ key: string; value: string }>;
  actions: ProviderJsonStateActions;
  allowCreateProvider?: boolean;
  onCreateCustomProvider?: (draft: CustomProviderDraft) => Promise<void>;
  onProviderChange?: (providerId: ProviderId) => void;
};

export const useProviderJsonApply = ({
  providerId,
  currentHeaders,
  actions,
  allowCreateProvider = false,
  onCreateCustomProvider,
  onProviderChange,
}: UseProviderJsonApplyOptions) =>
  useCallback(
    async (value: string) => {
      const parsed = parseProviderJsonText(value);
      if (allowCreateProvider) {
        const draft = createCustomProviderDraftFromJson(parsed);
        await onCreateCustomProvider?.(draft);
        onProviderChange?.(draft.id as ProviderId);
      } else if (parsed.providerId !== providerId) {
        throw new Error('当前供应商的 providerId 不能改');
      }

      applyProviderJsonToFormState({
        providerJson: parsed,
        currentHeaders,
        actions,
      });
    },
    [
      actions,
      allowCreateProvider,
      currentHeaders,
      onCreateCustomProvider,
      onProviderChange,
      providerId,
    ]
  );
