import type { ProviderId } from '@/shared/types/chat';
import type { ProviderReasoningPreference, ReasoningLevel } from '@/infrastructure/providers/types';
import {
  getModelNameVariants,
  hasModelAlias,
  matchesModelVariant,
  resolveReasoningPairModel,
} from '@/infrastructure/providers/reasoningModelMatching';
import { getProviderTransport } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';

export type ReasoningCapability =
  | { kind: 'none' }
  | { kind: 'toggle' }
  | { kind: 'fixed_on' }
  | { kind: 'effort'; supportedLevels: ReasoningLevel[] }
  | { kind: 'effort_fixed_on'; supportedLevels: ReasoningLevel[] };

const OPENAI_FOUR_LEVEL_MODELS = new Set([
  'gpt-5.5',
  'gpt-5.2',
  'gpt-5.2-codex',
  'gpt-5.3-codex',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
]);

const OPENAI_THREE_LEVEL_MODELS = new Set(['gpt-5', 'gpt-5.1']);
const OPENAI_FOUR_LEVELS: ReasoningLevel[] = ['low', 'medium', 'high', 'xhigh'];
const OPENAI_THREE_LEVELS: ReasoningLevel[] = ['low', 'medium', 'high'];
const DEEPSEEK_REASONING_LEVELS: ReasoningLevel[] = ['high', 'xhigh'];
const EMPTY_CAPABILITY: ReasoningCapability = { kind: 'none' };

const XAI_REASONING_MODEL_PAIRS = new Map<string, string>([
  ['grok-4-fast-reasoning', 'grok-4-fast-non-reasoning'],
  ['grok-4-1-fast-reasoning', 'grok-4-1-fast-non-reasoning'],
  ['grok-4.20-0309-reasoning', 'grok-4.20-0309-non-reasoning'],
]);

const LONGCAT_REASONING_MODEL_PAIRS = new Map<string, string>([
  ['longcat-flash-thinking', 'longcat-flash-chat'],
  ['longcat-flash-thinking-2601', 'longcat-flash-chat'],
]);

const getOpenAIReasoningLevels = (modelName: string): ReasoningLevel[] => {
  const variants = getModelNameVariants(modelName);
  if (variants.some((variant) => OPENAI_FOUR_LEVEL_MODELS.has(variant))) {
    return OPENAI_FOUR_LEVELS;
  }

  if (variants.some((variant) => OPENAI_THREE_LEVEL_MODELS.has(variant))) {
    return OPENAI_THREE_LEVELS;
  }

  return [];
};

const isGatewayProvider = (providerId: ProviderId): boolean =>
  providerId === 'modelscope' ||
  providerId === 'openadapter' ||
  providerId === 'opencode' ||
  providerId === 'poe' ||
  providerId === 'openai-compatible';

const isDeepSeekReasoningModel = (modelName: string): boolean =>
  matchesModelVariant(modelName, (variant) => variant === 'deepseek-v4-pro');

const supportsReasoningPairModel = (modelName: string, pairs: Map<string, string>): boolean =>
  Array.from(pairs.entries()).some(
    ([reasoningModel, nonReasoningModel]) =>
      hasModelAlias(modelName, reasoningModel) || hasModelAlias(modelName, nonReasoningModel)
  );

export const supportsGlmReasoningControl = (modelName: string): boolean => {
  return matchesModelVariant(
    modelName,
    (variant) =>
      variant.startsWith('glm-5') ||
      variant.startsWith('glm-4.7') ||
      variant.startsWith('glm-4.6') ||
      variant.startsWith('glm-4.5') ||
      variant.startsWith('glm-z') ||
      (variant.startsWith('glm') && variant.includes('thinking'))
  );
};

export const buildGlmReasoningOptions = (enabled: boolean): Record<string, unknown> => ({
  thinking: enabled
    ? {
        type: 'enabled',
        clear_thinking: false,
      }
    : {
        type: 'disabled',
      },
});

export const supportsDeepSeekReasoningControl = (modelName: string): boolean => {
  return isDeepSeekReasoningModel(modelName);
};

const normalizeDeepSeekReasoningEffort = (level?: ReasoningLevel): 'high' | 'max' =>
  level === 'xhigh' ? 'max' : 'high';

export const buildDeepSeekReasoningOptions = (
  modelName: string,
  preference: ProviderReasoningPreference
): Record<string, unknown> | undefined => {
  if (!supportsDeepSeekReasoningControl(modelName)) {
    return undefined;
  }

  const thinking = {
    type: preference.enabled ? 'enabled' : 'disabled',
  };

  if (!preference.enabled) {
    return { thinking };
  }

  return {
    thinking,
    reasoningEffort: normalizeDeepSeekReasoningEffort(preference.level),
  };
};

const isMoonshotFixedReasoningModel = (modelName: string): boolean => {
  return matchesModelVariant(
    modelName,
    (variant) =>
      variant === 'kimi-k2-thinking' ||
      variant === 'kimi-k2-thinking-model' ||
      variant === 'kimi-k2-thinking-turbo' ||
      variant === 'kimi-thinking-preview'
  );
};

export const supportsMoonshotReasoningControl = (modelName: string): boolean => {
  return matchesModelVariant(
    modelName,
    (variant) => variant === 'kimi-k2.6' || variant === 'kimi-k2.5'
  );
};

export const buildMoonshotReasoningOptions = (enabled: boolean): Record<string, unknown> => ({
  ...(enabled
    ? {
        thinking: {
          type: 'enabled',
          budgetTokens: 2048,
        },
        reasoningHistory: 'preserved',
      }
    : {}),
});

export const supportsOpenAIReasoningControl = (modelName: string): boolean => {
  return getOpenAIReasoningLevels(modelName).length > 0;
};

const normalizeReasoningLevel = (
  requestedLevel: ReasoningLevel | undefined,
  supportedLevels: ReasoningLevel[]
): ReasoningLevel | undefined => {
  if (supportedLevels.length === 0) {
    return undefined;
  }

  const requested = requestedLevel ?? 'medium';
  if (supportedLevels.includes(requested)) {
    return requested;
  }

  return undefined;
};

const getDefaultReasoningLevel = (supportedLevels: ReasoningLevel[]): ReasoningLevel => {
  if (supportedLevels.includes('medium')) {
    return 'medium';
  }

  if (supportedLevels.includes('xhigh')) {
    return 'xhigh';
  }

  return supportedLevels[0] ?? 'medium';
};

export const buildOpenAIReasoningOptions = (
  modelName: string,
  preference: ProviderReasoningPreference
): Record<string, unknown> | undefined => {
  const supportedLevels = getOpenAIReasoningLevels(modelName);
  if (!preference.enabled || supportedLevels.length === 0) {
    return undefined;
  }

  const level = normalizeReasoningLevel(preference.level, supportedLevels);
  if (!level) {
    return undefined;
  }

  return {
    reasoningEffort: level,
    reasoningSummary: 'auto',
  };
};

export const resolveXaiModelForReasoning = (modelName: string, enabled: boolean): string => {
  return resolveReasoningPairModel(modelName, enabled, XAI_REASONING_MODEL_PAIRS);
};

export const supportsLongcatReasoningControl = (modelName: string): boolean => {
  return supportsReasoningPairModel(modelName, LONGCAT_REASONING_MODEL_PAIRS);
};

export const resolveLongcatModelForReasoning = (modelName: string, enabled: boolean): string => {
  return resolveReasoningPairModel(modelName, enabled, LONGCAT_REASONING_MODEL_PAIRS);
};

const getOpenAICompatibleReasoningFamily = (
  modelName: string
): 'openai' | 'deepseek' | 'glm' | 'moonshot-toggle' | 'moonshot-fixed' | 'none' => {
  if (supportsOpenAIReasoningControl(modelName)) {
    return 'openai';
  }

  if (supportsDeepSeekReasoningControl(modelName)) {
    return 'deepseek';
  }

  if (supportsGlmReasoningControl(modelName)) {
    return 'glm';
  }

  if (isMoonshotFixedReasoningModel(modelName)) {
    return 'moonshot-fixed';
  }

  if (supportsMoonshotReasoningControl(modelName)) {
    return 'moonshot-toggle';
  }

  return 'none';
};

export const resolveOpenAICompatibleModelForReasoning = (
  modelName: string,
  _enabled: boolean
): string => modelName;

export const buildOpenAICompatibleChatReasoningOptions = (
  modelName: string,
  preference: ProviderReasoningPreference
): Record<string, unknown> | undefined => {
  switch (getOpenAICompatibleReasoningFamily(modelName)) {
    case 'openai': {
      const options = buildOpenAIReasoningOptions(modelName, preference);
      if (!options) {
        return undefined;
      }

      return {
        reasoningEffort: options.reasoningEffort,
      };
    }
    case 'deepseek':
      return buildDeepSeekReasoningOptions(modelName, preference);
    case 'glm':
      return buildGlmReasoningOptions(preference.enabled);
    case 'moonshot-toggle':
      return buildMoonshotReasoningOptions(preference.enabled);
    default:
      return undefined;
  }
};

export const resolveReasoningCapability = (
  providerId: ProviderId,
  modelName: string
): ReasoningCapability => {
  const transport = getProviderTransport(providerId) ?? providerId;

  if (transport === 'openai') {
    const supportedLevels = getOpenAIReasoningLevels(modelName);
    return supportedLevels.length > 0 ? { kind: 'effort', supportedLevels } : EMPTY_CAPABILITY;
  }

  if (transport === 'deepseek') {
    return supportsDeepSeekReasoningControl(modelName)
      ? { kind: 'effort', supportedLevels: DEEPSEEK_REASONING_LEVELS }
      : EMPTY_CAPABILITY;
  }

  if (transport === 'glm') {
    return supportsGlmReasoningControl(modelName) ? { kind: 'toggle' } : EMPTY_CAPABILITY;
  }

  if (transport === 'moonshot') {
    if (isMoonshotFixedReasoningModel(modelName)) {
      return { kind: 'fixed_on' };
    }

    return supportsMoonshotReasoningControl(modelName) ? { kind: 'toggle' } : EMPTY_CAPABILITY;
  }

  if (transport === 'xai' || transport === 'minimax') {
    return EMPTY_CAPABILITY;
  }

  if (transport === 'longcat') {
    return supportsLongcatReasoningControl(modelName) ? { kind: 'toggle' } : EMPTY_CAPABILITY;
  }

  if (transport === 'openai-compatible' || isGatewayProvider(transport)) {
    switch (getOpenAICompatibleReasoningFamily(modelName)) {
      case 'openai':
        return {
          kind: 'effort',
          supportedLevels: getOpenAIReasoningLevels(modelName),
        };
      case 'deepseek':
        return {
          kind: 'effort',
          supportedLevels: DEEPSEEK_REASONING_LEVELS,
        };
      case 'glm':
      case 'moonshot-toggle':
        return { kind: 'toggle' };
      case 'moonshot-fixed':
        return { kind: 'fixed_on' };
      default:
        return EMPTY_CAPABILITY;
    }
  }

  return EMPTY_CAPABILITY;
};

export const resolveEffectiveReasoningPreference = (
  providerId: ProviderId,
  modelName: string,
  preference: ProviderReasoningPreference
): ProviderReasoningPreference => {
  const capability = resolveReasoningCapability(providerId, modelName);

  switch (capability.kind) {
    case 'effort':
      return {
        enabled: preference.enabled,
        level:
          normalizeReasoningLevel(preference.level, capability.supportedLevels) ??
          getDefaultReasoningLevel(capability.supportedLevels),
      };
    case 'effort_fixed_on':
      return {
        enabled: true,
        level:
          normalizeReasoningLevel(preference.level, capability.supportedLevels) ??
          getDefaultReasoningLevel(capability.supportedLevels),
      };
    case 'fixed_on':
      return {
        enabled: true,
        level: preference.level,
      };
    case 'toggle':
      return {
        enabled: preference.enabled,
        level: preference.level,
      };
    default:
      return {
        enabled: false,
        level: preference.level,
      };
  }
};
