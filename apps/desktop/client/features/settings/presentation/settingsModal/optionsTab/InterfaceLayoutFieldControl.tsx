import type { RefObject } from 'react';
import { Dropdown, Input } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import type { InterfaceLayoutField } from '@client/features/settings/infrastructure/interfaceLayoutConfig';
import { fullInputClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import {
  SettingsControlGroup,
  SettingsHint,
  SettingsToggleRow,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import { CUSTOM_FONT_PRESET_VALUE } from '@client/features/settings/presentation/settingsModal/optionsTab/constants';
import {
  AccentButtonGroup,
  focusAndSelectInput,
} from '@client/features/settings/presentation/settingsModal/optionsTab/InterfaceSettingsControls';
import {
  buildFontPresetOptions,
  buildFontSizeOptions,
} from '@client/features/settings/presentation/settingsModal/optionsTab/optionFactories';
import type {
  OptionsInteractionLock,
  OptionsTabProps,
} from '@client/features/settings/presentation/settingsModal/optionsTab/types';

type InterfaceLayoutFieldControlProps = OptionsInteractionLock & {
  accentPreference: OptionsTabProps['accentPreference'];
  currentFontPresetValue: string;
  customFontInputRef: RefObject<HTMLInputElement | null>;
  field: InterfaceLayoutField;
  reduceMotion: boolean;
  setIsCustomFontSelected: (value: boolean) => void;
  sidebarCollapsed: boolean;
  uiFontFamily: string;
  uiFontSize: OptionsTabProps['uiFontSize'];
  onAccentPreferenceChange: OptionsTabProps['onAccentPreferenceChange'];
  onToggleReduceMotion: OptionsTabProps['onToggleReduceMotion'];
  onToggleSidebarCollapsed: OptionsTabProps['onToggleSidebarCollapsed'];
  onUiFontFamilyChange: OptionsTabProps['onUiFontFamilyChange'];
  onUiFontSizeChange: OptionsTabProps['onUiFontSizeChange'];
};

export const InterfaceLayoutFieldControl = ({
  accentPreference,
  currentFontPresetValue,
  customFontInputRef,
  field,
  isInteractionLocked,
  interactionLockTitle,
  reduceMotion,
  setIsCustomFontSelected,
  sidebarCollapsed,
  uiFontFamily,
  uiFontSize,
  onAccentPreferenceChange,
  onToggleReduceMotion,
  onToggleSidebarCollapsed,
  onUiFontFamilyChange,
  onUiFontSizeChange,
}: InterfaceLayoutFieldControlProps) => {
  if (field === 'accent') {
    return (
      <div className="space-y-2">
        <AccentButtonGroup
          value={accentPreference}
          isInteractionLocked={isInteractionLocked}
          interactionLockTitle={interactionLockTitle}
          onChange={(value) =>
            onAccentPreferenceChange(value as OptionsTabProps['accentPreference'])
          }
        />
      </div>
    );
  }

  if (field === 'uiFontPreset') {
    return (
      <SettingsControlGroup label={t('settings.options.uiFontPreset.label')}>
        <Dropdown
          value={currentFontPresetValue}
          options={buildFontPresetOptions()}
          onChange={(value) => {
            if (value === CUSTOM_FONT_PRESET_VALUE) {
              setIsCustomFontSelected(true);
              focusAndSelectInput(customFontInputRef.current);
              return;
            }

            setIsCustomFontSelected(false);
            onUiFontFamilyChange(value);
          }}
          widthClassName="w-full"
          disabled={isInteractionLocked}
        />
      </SettingsControlGroup>
    );
  }

  if (field === 'uiFontSize') {
    return (
      <SettingsControlGroup label={t('settings.options.uiFontSize.label')}>
        <Dropdown
          value={uiFontSize}
          options={buildFontSizeOptions()}
          onChange={(value) => onUiFontSizeChange(value as OptionsTabProps['uiFontSize'])}
          widthClassName="w-full"
          disabled={isInteractionLocked}
        />
      </SettingsControlGroup>
    );
  }

  if (field === 'uiFontCustom') {
    return (
      <SettingsControlGroup label={t('settings.options.uiFontCustom.label')}>
        <div className="space-y-2">
          <Input
            ref={customFontInputRef}
            type="text"
            value={uiFontFamily}
            onChange={(event) => {
              setIsCustomFontSelected(true);
              onUiFontFamilyChange(event.target.value);
            }}
            className={fullInputClass}
            compact
            autoComplete="off"
            spellCheck={false}
            placeholder={t('settings.options.uiFontCustom.placeholder')}
            disabled={isInteractionLocked}
            title={interactionLockTitle}
          />
          <SettingsHint>{t('settings.options.uiFontCustom.help')}</SettingsHint>
        </div>
      </SettingsControlGroup>
    );
  }

  if (field === 'reduceMotion') {
    return (
      <SettingsToggleRow
        checked={reduceMotion}
        title={t('settings.options.reduceMotion.title')}
        onCheckedChange={onToggleReduceMotion}
        disabled={isInteractionLocked}
      />
    );
  }

  if (field === 'sidebarCollapsed') {
    return (
      <SettingsToggleRow
        checked={sidebarCollapsed}
        title={t('settings.options.sidebarCollapsed.title')}
        onCheckedChange={onToggleSidebarCollapsed}
        disabled={isInteractionLocked}
      />
    );
  }

  return null;
};

