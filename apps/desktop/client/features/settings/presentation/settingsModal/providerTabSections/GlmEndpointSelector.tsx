import type { GlmEndpointMode } from '@/infrastructure/providers/config/baseUrl';
import { Field } from '@/shared/ui';
import { CheckIcon } from '@/shared/ui/icons';
import { t } from '@/shared/utils/i18n';
import {
  SEGMENT_CONTAINER_CLASS,
  getSegmentButtonClassName,
} from '@client/features/settings/presentation/settingsModal/optionsTab/constants';

type GlmEndpointSelectorProps = {
  activeMode?: GlmEndpointMode;
  onModeChange: (mode: GlmEndpointMode) => void;
};

const GLM_ENDPOINT_OPTIONS: Array<{ value: GlmEndpointMode; labelKey: string }> = [
  { value: 'api', labelKey: 'settings.modal.glmEndpoint.api' },
  { value: 'coding', labelKey: 'settings.modal.glmEndpoint.codingPlan' },
];

const GLM_ENDPOINT_SEGMENT_CONTAINER_CLASS = `${SEGMENT_CONTAINER_CLASS} w-[18rem] max-w-full`;

export const GlmEndpointSelector = ({ activeMode, onModeChange }: GlmEndpointSelectorProps) => {
  return (
    <Field label={t('settings.modal.glmEndpoint')}>
      <div className={GLM_ENDPOINT_SEGMENT_CONTAINER_CLASS}>
        {GLM_ENDPOINT_OPTIONS.map((option) => {
          const isActive = activeMode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              className={`${getSegmentButtonClassName(isActive)} min-w-0`}
              aria-pressed={isActive}
            >
              <span className="whitespace-nowrap">{t(option.labelKey)}</span>
              <span className="flex h-[13px] w-[13px] shrink-0 items-center justify-center">
                {isActive ? <CheckIcon size={13} strokeWidth={2} /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </Field>
  );
};
