import { t } from '@/shared/utils/i18n';
import { Dropdown, Field } from '@/shared/ui';
import type { ProviderId } from '@/shared/types/chat';
import { partitionBuiltInProviderOptionsByProviderKind } from '@client/features/settings/presentation/settingsModal/sections/providerCatalog';
import { ModelPicker } from '@client/features/settings/presentation/settingsModal/providerTabSections/ModelPicker';
import type { ModelSelectorProps } from '@client/features/settings/presentation/settingsModal/sections/providerTab.types';

const SPLIT_PROVIDER_DROPDOWN_WIDTH_CLASS = 'w-[12.25rem]';

const FieldLabel = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="space-y-1">
    <div>{title}</div>
    {hint ? <div className="text-[11px] font-normal text-[var(--ink-3)]">{hint}</div> : null}
  </div>
);

type ProviderSelectorProps = Pick<
  ModelSelectorProps,
  'providerId' | 'providerOptions' | 'providerLabel' | 'providerActions' | 'onProviderChange'
>;

type ModelFieldProps = Pick<
  ModelSelectorProps,
  | 'modelName'
  | 'availableModels'
  | 'isFetchingModels'
  | 'modelFetchError'
  | 'onModelNameChange'
  | 'onFetchModels'
>;

export const ProviderSelector = ({
  providerId,
  providerOptions,
  providerLabel,
  providerActions,
  onProviderChange,
}: ProviderSelectorProps) => {
  const shouldSplitBuiltInProviders = !providerLabel;
  const { official, thirdParty } = partitionBuiltInProviderOptionsByProviderKind(providerOptions);
  const hasSplitProviderOptions = thirdParty.length > 0;
  const handleProviderChange = (value: string) => onProviderChange(value as ProviderId);

  if (shouldSplitBuiltInProviders && hasSplitProviderOptions) {
    return (
      <div className="flex flex-wrap items-end gap-2">
        <Field label={<FieldLabel title={t('settings.modal.provider.official')} />}>
          <Dropdown
            value={providerId}
            options={official}
            onChange={handleProviderChange}
            widthClassName={SPLIT_PROVIDER_DROPDOWN_WIDTH_CLASS}
            placeholder={t('settings.modal.provider.official')}
          />
        </Field>
        <Field label={<FieldLabel title={t('settings.modal.provider.thirdParty')} />}>
          <Dropdown
            value={providerId}
            options={thirdParty}
            onChange={handleProviderChange}
            widthClassName={SPLIT_PROVIDER_DROPDOWN_WIDTH_CLASS}
            placeholder={t('settings.modal.provider.thirdParty')}
          />
        </Field>
        <div className="flex-none">{providerActions}</div>
      </div>
    );
  }

  return (
    <Field label={<FieldLabel title={providerLabel ?? t('settings.modal.provider')} />}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-none">
          <Dropdown
            value={providerId}
            options={providerOptions}
            onChange={handleProviderChange}
            widthClassName="min-w-[11rem] max-w-[22rem] w-fit"
            wrapLabel
          />
        </div>
        {providerActions}
      </div>
    </Field>
  );
};

export const ModelField = ({
  modelName,
  availableModels,
  isFetchingModels,
  modelFetchError,
  onModelNameChange,
  onFetchModels,
}: ModelFieldProps) => {
  return (
    <Field label={<FieldLabel title={t('settings.modal.model')} />}>
      <ModelPicker
        value={modelName}
        availableModels={availableModels}
        isFetching={isFetchingModels}
        fetchError={modelFetchError}
        fetchingLabel={t('settings.modal.model.fetching')}
        fetchLabel={t('settings.modal.model.fetch')}
        noMatchesLabel={t('settings.modal.model.noMatches')}
        resultsPrefix={t('settings.modal.model.resultsPrefix')}
        resultsSuffix={t('settings.modal.model.resultsSuffix')}
        onChange={onModelNameChange}
        onFetch={onFetchModels}
      />
    </Field>
  );
};
