import { getOpenCodeBaseUrlForEndpoint } from '@/infrastructure/providers/config/baseUrl';
import { Field } from '@/shared/ui';
import { CheckIcon } from '@/shared/ui/icons';
import { t } from '@/shared/utils/i18n';
import {
  SEGMENT_CONTAINER_CLASS,
  getSegmentButtonClassName,
} from '@client/features/settings/presentation/settingsModal/optionsTab/constants';

type OpenCodeEndpoint = 'zen' | 'go';

type OpenCodeEndpointSelectorProps = {
  baseUrl?: string;
  onBaseUrlChange: (value: string) => void;
};

const ENDPOINT_OPTIONS: Array<{ value: OpenCodeEndpoint; label: string }> = [
  { value: 'zen', label: 'OpenCode Zen' },
  { value: 'go', label: 'OpenCode Go' },
];

const ENDPOINT_SEGMENT_CONTAINER_CLASS = `${SEGMENT_CONTAINER_CLASS} w-[18rem] max-w-full`;

const normalizeBaseUrl = (value?: string): string => value?.trim().replace(/\/+$/, '') ?? '';

const resolveActiveEndpoint = (baseUrl?: string): OpenCodeEndpoint | 'custom' => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (normalizedBaseUrl === normalizeBaseUrl(getOpenCodeBaseUrlForEndpoint('zen'))) {
    return 'zen';
  }

  if (normalizedBaseUrl === normalizeBaseUrl(getOpenCodeBaseUrlForEndpoint('go'))) {
    return 'go';
  }

  return 'custom';
};

export const OpenCodeEndpointSelector = ({
  baseUrl,
  onBaseUrlChange,
}: OpenCodeEndpointSelectorProps) => {
  const activeEndpoint = resolveActiveEndpoint(baseUrl);

  return (
    <Field label={t('settings.modal.opencodeEndpoint')}>
      <div className={ENDPOINT_SEGMENT_CONTAINER_CLASS}>
        {ENDPOINT_OPTIONS.map((option) => {
          const isActive = activeEndpoint === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onBaseUrlChange(getOpenCodeBaseUrlForEndpoint(option.value))}
              className={`${getSegmentButtonClassName(isActive)} min-w-0`}
              aria-pressed={isActive}
            >
              <span className="whitespace-nowrap">{option.label}</span>
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
