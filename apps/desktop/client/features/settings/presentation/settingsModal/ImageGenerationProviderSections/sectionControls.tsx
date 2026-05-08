import { Input } from '@/shared/ui';
import type { ImageGenerationSettings } from '@/infrastructure/providers/imageGenerationSettings';
import {
  SettingsControlGroup,
  SettingsToggleRow,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
export type SettingsKey = keyof ImageGenerationSettings;

export const NumberSetting = ({
  disabled,
  imageGeneration,
  label,
  max,
  min,
  onUpdate,
  setting,
  step = 1,
}: {
  disabled: boolean;
  imageGeneration: ImageGenerationSettings;
  label: string;
  max?: number;
  min?: number;
  onUpdate: (patch: Partial<ImageGenerationSettings>) => void;
  setting: SettingsKey;
  step?: number;
}) => (
  <SettingsControlGroup label={label}>
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={(imageGeneration[setting] as number | undefined) ?? ''}
      className="block w-full"
      onChange={(event) =>
        onUpdate({
          [setting]: event.target.value ? Number(event.target.value) : undefined,
        } as Partial<ImageGenerationSettings>)
      }
      disabled={disabled}
    />
  </SettingsControlGroup>
);

export const TextSetting = ({
  disabled,
  imageGeneration,
  label,
  onUpdate,
  setting,
}: {
  disabled: boolean;
  imageGeneration: ImageGenerationSettings;
  label: string;
  onUpdate: (patch: Partial<ImageGenerationSettings>) => void;
  setting: SettingsKey;
}) => (
  <SettingsControlGroup label={label}>
    <Input
      value={(imageGeneration[setting] as string | undefined) ?? ''}
      className="block w-full"
      onChange={(event) =>
        onUpdate({ [setting]: event.target.value } as Partial<ImageGenerationSettings>)
      }
      disabled={disabled}
    />
  </SettingsControlGroup>
);

export const TextAreaSetting = ({
  disabled,
  imageGeneration,
  label,
  onUpdate,
  setting,
}: {
  disabled: boolean;
  imageGeneration: ImageGenerationSettings;
  label: string;
  onUpdate: (patch: Partial<ImageGenerationSettings>) => void;
  setting: SettingsKey;
}) => (
  <SettingsControlGroup label={label} className="space-y-2 md:col-span-2">
    <textarea
      value={(imageGeneration[setting] as string | undefined) ?? ''}
      className="block min-h-20 w-full resize-y border border-[var(--border-2)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-1)] outline-none focus:border-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-60"
      onChange={(event) =>
        onUpdate({ [setting]: event.target.value } as Partial<ImageGenerationSettings>)
      }
      disabled={disabled}
    />
  </SettingsControlGroup>
);

export const ToggleSetting = ({
  checked,
  disabled,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <SettingsControlGroup label={label}>
    <SettingsToggleRow checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
  </SettingsControlGroup>
);



