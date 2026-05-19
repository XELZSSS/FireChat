import { Dropdown, Field } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import type {
  PetMotion,
  PetPosition,
  PetSettings,
  PetSize,
  PetStyle,
} from '@client/features/pet/domain/petTypes';
import PetPreview from '@client/features/pet/presentation/PetPreview';
import {
  SettingsCard,
  SettingsControlGroup,
  SettingsToggleRow,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';

type PetTabProps = {
  petSettings: PetSettings;
  mutationsLockedReason?: string | null;
  onPetSettingsChange: (value: PetSettings) => void;
};

const STYLE_OPTIONS = [
  { value: 'default', label: t('settings.pet.style.default') },
  { value: 'pixel', label: t('settings.pet.style.pixel') },
  { value: 'minimal', label: t('settings.pet.style.minimal') },
];

const SIZE_OPTIONS = [
  { value: 'small', label: t('settings.pet.size.small') },
  { value: 'medium', label: t('settings.pet.size.medium') },
  { value: 'large', label: t('settings.pet.size.large') },
];

const POSITION_OPTIONS = [
  { value: 'input-left', label: t('settings.pet.position.inputLeft') },
  { value: 'input-right', label: t('settings.pet.position.inputRight') },
];

const MOTION_OPTIONS = [
  { value: 'off', label: t('settings.pet.motion.off') },
  { value: 'subtle', label: t('settings.pet.motion.subtle') },
  { value: 'active', label: t('settings.pet.motion.active') },
];

const PetTab = ({
  petSettings,
  mutationsLockedReason = null,
  onPetSettingsChange,
}: PetTabProps) => {
  const isInteractionLocked = Boolean(mutationsLockedReason);
  const interactionLockTitle = mutationsLockedReason ?? undefined;

  const updatePetSettings = <K extends keyof PetSettings>(key: K, value: PetSettings[K]) => {
    onPetSettingsChange({
      ...petSettings,
      [key]: value,
    });
  };

  return (
    <Field label={t('settings.pet.title')}>
      <SettingsCard className="space-y-3">
        <PetPreview settings={petSettings} />

        <SettingsToggleRow
          checked={petSettings.enabled}
          title={t('settings.pet.enabled.title')}
          onCheckedChange={(value) => updatePetSettings('enabled', value)}
          disabled={isInteractionLocked}
        />

        <div className="grid grid-cols-2 gap-3">
          <SettingsControlGroup label={t('settings.pet.style.label')}>
            <Dropdown
              value={petSettings.style}
              options={STYLE_OPTIONS}
              onChange={(value) => updatePetSettings('style', value as PetStyle)}
              disabled={isInteractionLocked}
              widthClassName="w-full"
            />
          </SettingsControlGroup>

          <SettingsControlGroup label={t('settings.pet.size.label')}>
            <Dropdown
              value={petSettings.size}
              options={SIZE_OPTIONS}
              onChange={(value) => updatePetSettings('size', value as PetSize)}
              disabled={isInteractionLocked}
              widthClassName="w-full"
            />
          </SettingsControlGroup>

          <SettingsControlGroup label={t('settings.pet.position.label')}>
            <Dropdown
              value={petSettings.position}
              options={POSITION_OPTIONS}
              onChange={(value) => updatePetSettings('position', value as PetPosition)}
              disabled={isInteractionLocked}
              widthClassName="w-full"
            />
          </SettingsControlGroup>

          <SettingsControlGroup label={t('settings.pet.motion.label')}>
            <Dropdown
              value={petSettings.motion}
              options={MOTION_OPTIONS}
              onChange={(value) => updatePetSettings('motion', value as PetMotion)}
              disabled={isInteractionLocked}
              widthClassName="w-full"
            />
          </SettingsControlGroup>
        </div>

        <SettingsToggleRow
          checked={petSettings.reactions}
          title={t('settings.pet.reactions.title')}
          onCheckedChange={(value) => updatePetSettings('reactions', value)}
          disabled={isInteractionLocked}
          description={interactionLockTitle}
        />
      </SettingsCard>
    </Field>
  );
};

export default PetTab;
