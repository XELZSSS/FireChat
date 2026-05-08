import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { SetStateAction } from 'react';
import type { ChatService } from '@client/features/chat/application/chatService';
import {
  persistReasoningPreference,
  readPersistedReasoningPreference,
  readReasoningPreferenceStoreValue,
  subscribeReasoningPreferenceStore,
  type StoredReasoningPreference,
} from '@/infrastructure/persistence/reasoningPreferenceStore';
import type { ReasoningCapability } from '@/infrastructure/providers/reasoningControl';
import {
  resolveEffectiveReasoningPreference,
  resolveReasoningCapability,
} from '@/infrastructure/providers/reasoningControl';
import type { ProviderReasoningPreference, ReasoningLevel } from '@/infrastructure/providers/types';
import type { ProviderId } from '@/shared/types/chat';

type UseReasoningControlOptions = {
  chatService: ChatService;
  currentProviderId: ProviderId;
  currentModelName: string;
};

const DEFAULT_REASONING_PREFERENCE: ProviderReasoningPreference = {
  enabled: false,
  level: 'medium',
};

const buildEffectiveReasoningPreference = (
  providerId: ProviderId,
  modelName: string,
  storedPreference: StoredReasoningPreference
): ProviderReasoningPreference =>
  resolveEffectiveReasoningPreference(providerId, modelName, {
    enabled: storedPreference.enabled ?? DEFAULT_REASONING_PREFERENCE.enabled,
    level: storedPreference.level ?? DEFAULT_REASONING_PREFERENCE.level,
  });

const getReasoningLevelOptions = (capability: ReasoningCapability): ReasoningLevel[] => {
  if (capability.kind !== 'effort' && capability.kind !== 'effort_fixed_on') {
    return [];
  }

  return [...capability.supportedLevels].sort((left, right) => {
    const order = ['xhigh', 'high', 'medium', 'low'];
    return order.indexOf(left) - order.indexOf(right);
  }) as ReasoningLevel[];
};

export const useReasoningControl = ({
  chatService,
  currentProviderId,
  currentModelName,
}: UseReasoningControlOptions) => {
  const storedReasoningControlValue = useSyncExternalStore(
    subscribeReasoningPreferenceStore,
    readReasoningPreferenceStoreValue,
    () => ''
  );

  const storedPreference = useMemo(
    () =>
      readPersistedReasoningPreference(
        storedReasoningControlValue,
        currentProviderId,
        currentModelName
      ),
    [currentModelName, currentProviderId, storedReasoningControlValue]
  );

  const reasoningCapability = useMemo(
    () => resolveReasoningCapability(currentProviderId, currentModelName),
    [currentModelName, currentProviderId]
  );
  const effectiveReasoningPreference = useMemo(
    () => buildEffectiveReasoningPreference(currentProviderId, currentModelName, storedPreference),
    [currentModelName, currentProviderId, storedPreference]
  );
  const reasoningLevelOptions = useMemo(
    () => getReasoningLevelOptions(reasoningCapability),
    [reasoningCapability]
  );
  const reasoningControlVisible = reasoningCapability.kind !== 'none';
  const reasoningLevelSupported =
    reasoningCapability.kind === 'effort' || reasoningCapability.kind === 'effort_fixed_on';
  const reasoningToggleLocked =
    reasoningCapability.kind === 'fixed_on' || reasoningCapability.kind === 'effort_fixed_on';

  useEffect(() => {
    chatService.setReasoningPreference(effectiveReasoningPreference);
  }, [chatService, effectiveReasoningPreference]);

  const setReasoningEnabled = useCallback(
    (value: SetStateAction<boolean>) => {
      if (reasoningCapability.kind === 'none' || reasoningToggleLocked) {
        return;
      }

      const nextEnabled =
        typeof value === 'function' ? value(effectiveReasoningPreference.enabled) : value;

      persistReasoningPreference(currentProviderId, currentModelName, {
        enabled: nextEnabled,
        level: effectiveReasoningPreference.level,
      });
    },
    [
      currentModelName,
      currentProviderId,
      effectiveReasoningPreference.enabled,
      effectiveReasoningPreference.level,
      reasoningCapability.kind,
      reasoningToggleLocked,
    ]
  );

  const setReasoningLevel = useCallback(
    (level: ReasoningLevel) => {
      if (reasoningCapability.kind !== 'effort' && reasoningCapability.kind !== 'effort_fixed_on') {
        return;
      }

      if (!reasoningCapability.supportedLevels.includes(level)) {
        return;
      }

      persistReasoningPreference(currentProviderId, currentModelName, {
        enabled: effectiveReasoningPreference.enabled,
        level,
      });
    },
    [currentModelName, currentProviderId, effectiveReasoningPreference.enabled, reasoningCapability]
  );

  return {
    reasoningCapability,
    reasoningControlVisible,
    reasoningEnabled: effectiveReasoningPreference.enabled,
    reasoningLevel: effectiveReasoningPreference.level ?? 'medium',
    reasoningLevelOptions,
    reasoningLevelSupported,
    reasoningToggleLocked,
    setReasoningEnabled,
    setReasoningLevel,
  };
};
