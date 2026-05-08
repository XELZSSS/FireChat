import type { ComponentProps } from 'react';
import ImageGenerationTab from '@client/features/settings/presentation/settingsModal/tabs/ImageGenerationTab';
import SearchTab from '@client/features/settings/presentation/settingsModal/tabs/SearchTab';
import { normalizeImageGenerationSettings } from '@/infrastructure/providers/imageGenerationSettings';
import type { SettingsTabContentBuildContext } from '@client/features/settings/presentation/settingsModal/tabs/tabContentBuilderTypes';

type ImageGenerationTabProps = ComponentProps<typeof ImageGenerationTab>;
type SearchTabProps = ComponentProps<typeof SearchTab>;

export const buildImageGenerationTabProps = ({
  controller,
  interactionLockReason,
}: Pick<
  SettingsTabContentBuildContext,
  'controller' | 'interactionLockReason'
>): ImageGenerationTabProps => {
  const {
    state,
    availableImageModels,
    isFetchingImageModels,
    imageModelFetchError,
    handleFetchImageModels,
    providerActions,
  } = controller;

  return {
    providerId: state.provider.providerId,
    imageModelName: state.provider.imageModelName,
    imageGeneration: normalizeImageGenerationSettings(state.provider.imageGeneration),
    availableImageModels,
    isFetchingImageModels,
    imageModelFetchError,
    mutationsLockedReason: interactionLockReason,
    onImageModelNameChange: providerActions.onImageModelNameChange,
    onImageGenerationChange: providerActions.onImageGenerationChange,
    onFetchImageModels: handleFetchImageModels,
  };
};

export const buildSearchTabProps = ({
  controller,
}: Pick<SettingsTabContentBuildContext, 'controller'>): SearchTabProps => {
  const { state, validation, searchActions, providerActions } = controller;
  const { provider, app, ui } = state;

  return {
    tavily: provider.tavily,
    showTavilyKey: ui.showTavilyKey,
    toolCallMaxRounds: app.toolCallMaxRounds,
    validationIssuesByField: validation.issuesByField,
    onSetTavilyField: searchActions.onSetTavilyField,
    onToggleTavilyKeyVisibility: searchActions.onToggleTavilyKeyVisibility,
    onToolCallMaxRoundsChange: providerActions.onToolCallMaxRoundsChange,
    onToolCallMaxRoundsBlur: providerActions.onToolCallMaxRoundsBlur,
  };
};

