import { t } from '@/shared/utils/i18n';
import {
  ACCENT_OPTIONS,
  getAccentButtonClassName,
} from '@client/features/settings/presentation/settingsModal/optionsTab/constants';
import type { OptionsInteractionLock } from '@client/features/settings/presentation/settingsModal/optionsTab/types';

export const focusAndSelectInput = (input: HTMLInputElement | null) => {
  window.requestAnimationFrame(() => {
    input?.focus();
    input?.select();
  });
};

type AccentButtonGroupProps = OptionsInteractionLock & {
  value: string;
  onChange: (value: string) => void;
};

export const AccentButtonGroup = ({
  value,
  isInteractionLocked,
  onChange,
}: AccentButtonGroupProps) => (
  <div className="grid w-full grid-cols-2 items-center justify-items-stretch gap-1 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
    {ACCENT_OPTIONS.map((option) => {
      const isActive = value === option.value;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={getAccentButtonClassName(isActive)}
          aria-pressed={isActive}
          aria-label={t(`settings.appearance.accent.${option.value}`)}
          title={t(`settings.appearance.accent.${option.value}`)}
          disabled={isInteractionLocked}
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <span className={`inline-flex h-4 w-4 ${option.swatchClassName}`} />
          </span>
        </button>
      );
    })}
  </div>
);
