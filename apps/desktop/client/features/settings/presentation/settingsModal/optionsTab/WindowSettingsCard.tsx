import { Field } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import {
  SettingsCard,
  SettingsToggleRow,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import type {
  OptionsInteractionLock,
  OptionsTabProps,
} from '@client/features/settings/presentation/settingsModal/optionsTab/types';

type WindowSettingsCardProps = OptionsInteractionLock &
  Pick<
    OptionsTabProps,
    | 'closeToTray'
    | 'minimizeToTray'
    | 'launchAtStartup'
    | 'startMinimizedToTray'
    | 'rememberWindowBounds'
    | 'onToggleCloseToTray'
    | 'onToggleMinimizeToTray'
    | 'onToggleLaunchAtStartup'
    | 'onToggleStartMinimizedToTray'
    | 'onToggleRememberWindowBounds'
  >;

const WindowSettingsCard = ({
  closeToTray,
  minimizeToTray,
  launchAtStartup,
  startMinimizedToTray,
  rememberWindowBounds,
  isInteractionLocked,
  onToggleCloseToTray,
  onToggleMinimizeToTray,
  onToggleLaunchAtStartup,
  onToggleStartMinimizedToTray,
  onToggleRememberWindowBounds,
}: WindowSettingsCardProps) => (
  <Field label={t('settings.options.window.title')}>
    <SettingsCard>
      <div className="grid gap-2 sm:grid-cols-2">
        <SettingsToggleRow
          checked={closeToTray}
          title={t('settings.options.closeToTray.title')}
          onCheckedChange={onToggleCloseToTray}
          disabled={isInteractionLocked}
        />
        <SettingsToggleRow
          checked={minimizeToTray}
          title={t('settings.options.minimizeToTray.title')}
          onCheckedChange={onToggleMinimizeToTray}
          disabled={isInteractionLocked}
        />
        <SettingsToggleRow
          checked={launchAtStartup}
          title={t('settings.options.launchAtStartup.title')}
          onCheckedChange={onToggleLaunchAtStartup}
          disabled={isInteractionLocked}
        />
        <SettingsToggleRow
          checked={startMinimizedToTray}
          title={t('settings.options.startMinimizedToTray.title')}
          onCheckedChange={onToggleStartMinimizedToTray}
          disabled={isInteractionLocked}
        />
        <SettingsToggleRow
          checked={rememberWindowBounds}
          title={t('settings.options.rememberWindowBounds.title')}
          onCheckedChange={onToggleRememberWindowBounds}
          disabled={isInteractionLocked}
        />
      </div>
    </SettingsCard>
  </Field>
);

export default WindowSettingsCard;

