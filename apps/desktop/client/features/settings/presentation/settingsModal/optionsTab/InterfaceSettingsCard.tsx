import { useMemo, useRef, useState } from 'react';
import { Button, Field } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import {
  SettingsCard,
  SettingsFieldMessages,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import {
  CUSTOM_FONT_PRESET_VALUE,
  WIDE_INTERFACE_FIELDS,
} from '@client/features/settings/presentation/settingsModal/optionsTab/constants';
import { getInterfaceLayoutConfig } from '@client/features/settings/presentation/settingsModal/optionsTab/interfaceLayout';
import { InterfaceLayoutFieldControl } from '@client/features/settings/presentation/settingsModal/optionsTab/InterfaceLayoutFieldControl';
import InterfaceJsonModal from '@client/features/settings/presentation/settingsModal/optionsTab/InterfaceJsonModal';
import { isPresetFontFamily } from '@client/features/settings/presentation/settingsModal/optionsTab/optionFactories';
import type {
  OptionsInteractionLock,
  OptionsTabProps,
} from '@client/features/settings/presentation/settingsModal/optionsTab/types';
import { useInterfaceJsonModal } from '@client/features/settings/presentation/settingsModal/optionsTab/useInterfaceJsonModal';

type InterfaceSettingsCardProps = OptionsInteractionLock &
  Pick<
    OptionsTabProps,
    | 'accentPreference'
    | 'uiFontFamily'
    | 'uiFontSize'
    | 'interfaceLayoutConfigText'
    | 'reduceMotion'
    | 'sidebarCollapsed'
    | 'validationIssuesByField'
    | 'onAccentPreferenceChange'
    | 'onUiFontFamilyChange'
    | 'onUiFontSizeChange'
    | 'onInterfaceLayoutConfigTextChange'
    | 'onToggleReduceMotion'
    | 'onToggleSidebarCollapsed'
  >;

const InterfaceSettingsCard = ({
  accentPreference,
  uiFontFamily,
  uiFontSize,
  interfaceLayoutConfigText,
  reduceMotion,
  sidebarCollapsed,
  validationIssuesByField,
  isInteractionLocked,
  interactionLockTitle,
  onAccentPreferenceChange,
  onUiFontFamilyChange,
  onUiFontSizeChange,
  onInterfaceLayoutConfigTextChange,
  onToggleReduceMotion,
  onToggleSidebarCollapsed,
}: InterfaceSettingsCardProps) => {
  const customFontInputRef = useRef<HTMLInputElement | null>(null);
  const [isCustomFontSelected, setIsCustomFontSelected] = useState(
    () => !isPresetFontFamily(uiFontFamily)
  );
  const interfaceLayoutConfig = useMemo(
    () => getInterfaceLayoutConfig(interfaceLayoutConfigText),
    [interfaceLayoutConfigText]
  );
  const interfaceLayoutIssues = validationIssuesByField['options.interfaceLayoutConfig'];
  const currentFontPresetValue =
    !isCustomFontSelected && isPresetFontFamily(uiFontFamily)
      ? uiFontFamily
      : CUSTOM_FONT_PRESET_VALUE;
  const {
    handleCloseJsonModal,
    handleJsonDraftChange,
    handleOpenJsonModal,
    handleSaveJsonModal,
    interfaceJsonDraft,
    interfaceJsonDraftError,
    isJsonModalOpen,
  } = useInterfaceJsonModal({
    interfaceLayoutConfigText,
    isInteractionLocked,
    onInterfaceLayoutConfigTextChange,
  });

  return (
    <>
      <Field label={t('settings.options.interface.title')}>
        <SettingsCard className="space-y-3">
          {interfaceLayoutConfig.interfaceCard.map((row, rowIndex) => {
            const visibleRow = row.filter((field) => field !== 'language' && field !== 'theme');

            if (visibleRow.length === 0) {
              return null;
            }

            return (
              <div
                key={`interface-row-${rowIndex}`}
                className={visibleRow.length > 1 ? 'grid gap-3 grid-cols-2' : 'space-y-2'}
              >
                {visibleRow.map((field, fieldIndex) => (
                  <div
                    key={`${rowIndex}-${field}-${fieldIndex}`}
                    className={
                      WIDE_INTERFACE_FIELDS.has(field) && visibleRow.length > 1 ? 'col-span-2' : ''
                    }
                  >
                    <InterfaceLayoutFieldControl
                      accentPreference={accentPreference}
                      currentFontPresetValue={currentFontPresetValue}
                      customFontInputRef={customFontInputRef}
                      field={field}
                      isInteractionLocked={isInteractionLocked}
                      interactionLockTitle={interactionLockTitle}
                      reduceMotion={reduceMotion}
                      setIsCustomFontSelected={setIsCustomFontSelected}
                      sidebarCollapsed={sidebarCollapsed}
                      uiFontFamily={uiFontFamily}
                      uiFontSize={uiFontSize}
                      onAccentPreferenceChange={onAccentPreferenceChange}
                      onToggleReduceMotion={onToggleReduceMotion}
                      onToggleSidebarCollapsed={onToggleSidebarCollapsed}
                      onUiFontFamilyChange={onUiFontFamilyChange}
                      onUiFontSizeChange={onUiFontSizeChange}
                    />
                  </div>
                ))}
              </div>
            );
          })}

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="subtle"
              size="sm"
              onClick={handleOpenJsonModal}
              className="w-fit"
              disabled={isInteractionLocked}
              title={interactionLockTitle}
            >
              {t('settings.options.interfaceJson.button')}
            </Button>
            <SettingsFieldMessages issues={interfaceLayoutIssues} />
          </div>
        </SettingsCard>
      </Field>

      <InterfaceJsonModal
        isOpen={isJsonModalOpen}
        draft={interfaceJsonDraft}
        errorMessage={interfaceJsonDraftError}
        isInteractionLocked={isInteractionLocked}
        interactionLockTitle={interactionLockTitle}
        onDraftChange={handleJsonDraftChange}
        onClose={handleCloseJsonModal}
        onSave={handleSaveJsonModal}
      />
    </>
  );
};

export default InterfaceSettingsCard;
