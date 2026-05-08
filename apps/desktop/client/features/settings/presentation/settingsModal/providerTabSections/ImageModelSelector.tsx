import { t } from '@/shared/utils/i18n';
import { Field } from '@/shared/ui';
import { ModelPicker } from '@client/features/settings/presentation/settingsModal/providerTabSections/ModelPicker';
import type { ImageModelSelectorProps } from '@client/features/settings/presentation/settingsModal/sections/providerTab.types';

export const ImageModelSelector = ({
  imageModelName,
  availableImageModels,
  isFetchingImageModels,
  imageModelFetchError,
  onImageModelNameChange,
  onFetchImageModels,
}: ImageModelSelectorProps) => {
  return (
    <Field label={t('settings.modal.imageModel')}>
      <ModelPicker
        value={imageModelName}
        availableModels={availableImageModels}
        isFetching={isFetchingImageModels}
        fetchError={imageModelFetchError}
        fetchingLabel={t('settings.modal.imageModel.fetching')}
        fetchLabel={t('settings.modal.imageModel.fetch')}
        noMatchesLabel={t('settings.modal.imageModel.noMatches')}
        resultsPrefix={t('settings.modal.imageModel.resultsPrefix')}
        resultsSuffix={t('settings.modal.imageModel.resultsSuffix')}
        onChange={onImageModelNameChange}
        onFetch={onFetchImageModels}
      />
    </Field>
  );
};

