import { listRuntimeProviderIds as listProviderIds } from '@/infrastructure/providers/runtime/providerRuntimeCatalog';
import { getProviderUiMetaForId } from '@/infrastructure/providers/config/providerConfig';
import { isImageOnlyProviderId } from '@/infrastructure/providers/providerImageMetadata';
import type { ProviderId } from '@/shared/types/chat';
import type { DropdownOption } from '@/shared/ui';
import { preloadDropdownIcons } from '@/shared/ui/composed/dropdownIconCache';
import type { ActiveSettingsTab } from '@client/features/settings/presentation/settingsModal/state/reducer';
import { PROVIDER_ICON_SRC } from '@client/features/settings/presentation/settingsModal/sections/providerIcons';

export { PROVIDER_ICON_SRC };

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

