import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import { getProviderUiMetaForId } from '@/infrastructure/providers/config/providerConfig';
import { isImageOnlyProviderId } from '@/infrastructure/providers/providerImageMetadata';
import type { ProviderId } from '@/shared/types/chat';
import type { DropdownOption } from '@/shared/ui';
import { preloadDropdownIcons } from '@/shared/ui/composed/dropdownIconCache';
import type { ActiveSettingsTab } from '@client/features/settings/presentation/settingsModal/state/reducer';

export const PROVIDER_ICON_SRC: Record<string, string> = {
  openai: './provider-icons/openai.svg',
  openrouter: './provider-icons/openrouter.ico',
  poe: './provider-icons/poe.svg',
  google: './provider-icons/google.png',
  'google-vertex': './provider-icons/google.png',
  groq: './provider-icons/groq.ico',
  together: './provider-icons/together.ico',
  fireworks: './provider-icons/fireworks.svg',
  cerebras: './provider-icons/cerebras.ico',
  perplexity: './provider-icons/perplexity.ico',
  cohere: './provider-icons/cohere.png',
  sambanova: './provider-icons/sambanova.ico',
  mistral: './provider-icons/mistral.ico',
  longcat: './provider-icons/longcat.svg',
  anthropic: './provider-icons/anthropic.ico',
  vercel: './provider-icons/vercel.ico',
  'open-responses': './provider-icons/open-responses.svg',
  deepinfra: './provider-icons/deepinfra.ico',
  huggingface: './provider-icons/huggingface.ico',
  alibaba: './provider-icons/alibaba-cloud.png',
  'amazon-bedrock': './provider-icons/amazon-bedrock.ico',
  'azure-openai': './provider-icons/azure-openai.ico',
  baseten: './provider-icons/baseten.ico',
  'nvidia-nim': './provider-icons/nvidia-nim.ico',
  clarifai: './provider-icons/clarifai.svg',
  heroku: './provider-icons/heroku.svg',
  'lm-studio': './provider-icons/lm-studio.ico',
  fal: './provider-icons/fal.ico',
  replicate: './provider-icons/replicate.png',
  'black-forest-labs': './provider-icons/black-forest-labs.ico',
  prodia: './provider-icons/prodia.png',
  'luma-ai': './provider-icons/luma-ai.ico',
  modelscope: './provider-icons/modelscope.ico',
  openadapter: './provider-icons/openadapter.png',
  opencode: './provider-icons/opencode.svg',
  'openai-compatible': './provider-icons/openai-compatible.svg',
  xai: './provider-icons/xai.ico',
  deepseek: './provider-icons/deepseek.ico',
  glm: './provider-icons/glm.png',
  minimax: './provider-icons/minimax.ico',
  modal: './provider-icons/modal.ico',
  moonshot: './provider-icons/moonshot.ico',
  volcengine: './provider-icons/volcengine.png',
  'xiaomi-mimo': './provider-icons/xiaomi-mimo.ico',
  stepfun: './provider-icons/stepfun.png',
  mulerouter: './provider-icons/mulerouter.svg',
};

let providerIconsPreloaded = false;

export const getProviderSource = (providerId: string): 'builtin' | 'custom' =>
  getProviderUiMetaForId(providerId)?.source ?? 'builtin';

export const resolveSettingsTabForProvider = (providerId: string): ActiveSettingsTab =>
  getProviderSource(providerId) === 'custom' ? 'customProvider' : 'provider';

export const resolveSelectableProviderId = (
  preferredProviderId: ProviderId | null | undefined,
  currentProviderId: ProviderId
): ProviderId => {
  const availableProviderIds = listProviderIds();
  const normalizedPreferredProviderId = preferredProviderId?.trim();
  if (
    normalizedPreferredProviderId &&
    availableProviderIds.includes(normalizedPreferredProviderId)
  ) {
    return normalizedPreferredProviderId;
  }

  if (availableProviderIds.includes(currentProviderId)) {
    return currentProviderId;
  }

  throw new Error(`Provider "${currentProviderId}" is unavailable.`);
};

export const preloadProviderIcons = (): void => {
  if (providerIconsPreloaded) {
    return;
  }

  preloadDropdownIcons(Object.values(PROVIDER_ICON_SRC));
  providerIconsPreloaded = true;
};

export const buildProviderOptions = (): DropdownOption[] => {
  return listProviderIds().map((id) => {
    const meta = getProviderUiMetaForId(id);
    const iconKey = meta?.icon ?? id;

    return {
      value: id,
      label: meta?.label ?? id.charAt(0).toUpperCase() + id.slice(1),
      iconSrc: PROVIDER_ICON_SRC[iconKey],
    };
  });
};

export const partitionProviderOptionsBySource = (providerOptions: DropdownOption[]) =>
  providerOptions.reduce(
    (result, option) => {
      if (getProviderSource(option.value) === 'custom') {
        result.custom.push(option);
      } else {
        result.builtIn.push(option);
      }

      return result;
    },
    { builtIn: [] as DropdownOption[], custom: [] as DropdownOption[] }
  );

const isThirdPartyProviderPlatform = (providerId: string): boolean => {
  const meta = getProviderUiMetaForId(providerId);
  return meta?.isOfficialProvider === false;
};

export const isImageOnlyProviderPlatform = (providerId: string): boolean =>
  isImageOnlyProviderId(providerId);

export const partitionBuiltInProviderOptionsByProviderKind = (providerOptions: DropdownOption[]) =>
  providerOptions.reduce(
    (result, option) => {
      if (isImageOnlyProviderPlatform(option.value)) {
        result.imageOnly.push(option);
      } else if (isThirdPartyProviderPlatform(option.value)) {
        result.thirdParty.push(option);
      } else {
        result.official.push(option);
      }

      return result;
    },
    {
      official: [] as DropdownOption[],
      thirdParty: [] as DropdownOption[],
      imageOnly: [] as DropdownOption[],
    }
  );

