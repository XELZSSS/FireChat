import { t } from '@/shared/utils/i18n';
import { Field } from '@/shared/ui';
import { CheckIcon } from '@/shared/ui/icons';
import {
  SEGMENT_CONTAINER_CLASS,
  getSegmentButtonClassName,
} from '@client/features/settings/presentation/settingsModal/optionsTab/constants';
import type { RegionSelectorProps } from '@client/features/settings/presentation/settingsModal/sections/providerTab.types';

type RegionOption = {
  key: 'intl' | 'cn';
  label: string;
  active: boolean;
  onSelect: () => void;
};

export const RegionSelector = ({
  isCnRegion,
  isIntlRegion,
  onSetRegionCn,
  onSetRegionIntl,
}: RegionSelectorProps) => {
  const options: RegionOption[] = [
    {
      key: 'intl',
      label: t('settings.modal.region.international'),
      active: isIntlRegion,
      onSelect: onSetRegionIntl,
    },
    {
      key: 'cn',
      label: t('settings.modal.region.china'),
      active: isCnRegion,
      onSelect: onSetRegionCn,
    },
  ];

  return (
    <Field label={t('settings.modal.region')}>
      <div className={SEGMENT_CONTAINER_CLASS}>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={option.onSelect}
            className={getSegmentButtonClassName(option.active)}
            aria-pressed={option.active}
          >
            <span>{option.label}</span>
            {option.active ? <CheckIcon size={13} strokeWidth={2} /> : null}
          </button>
        ))}
      </div>
    </Field>
  );
};
