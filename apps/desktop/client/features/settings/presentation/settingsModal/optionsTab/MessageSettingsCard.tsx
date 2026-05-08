import { Dropdown, Field } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import {
  SettingsCard,
  SettingsControlGroup,
  SettingsToggleRow,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import { buildSendShortcutOptions } from '@client/features/settings/presentation/settingsModal/optionsTab/optionFactories';
import type {
  OptionsInteractionLock,
  OptionsTabProps,
} from '@client/features/settings/presentation/settingsModal/optionsTab/types';

type MessageSettingsCardProps = OptionsInteractionLock &
  Pick<
    OptionsTabProps,
    | 'sendShortcut'
    | 'showMessageTimestamps'
    | 'wrapCodeBlocks'
    | 'onSendShortcutChange'
    | 'onToggleShowMessageTimestamps'
    | 'onToggleWrapCodeBlocks'
  >;

const MessageSettingsCard = ({
  sendShortcut,
  showMessageTimestamps,
  wrapCodeBlocks,
  isInteractionLocked,
  onSendShortcutChange,
  onToggleShowMessageTimestamps,
  onToggleWrapCodeBlocks,
}: MessageSettingsCardProps) => (
  <Field label={t('settings.options.message.title')}>
    <SettingsCard className="space-y-3">
      <SettingsControlGroup label={t('settings.options.sendShortcut.label')}>
        <Dropdown
          value={sendShortcut}
          options={buildSendShortcutOptions()}
          onChange={(value) => onSendShortcutChange(value as OptionsTabProps['sendShortcut'])}
          widthClassName="w-full"
          disabled={isInteractionLocked}
        />
      </SettingsControlGroup>
      <div className="grid gap-2 sm:grid-cols-2">
        <SettingsToggleRow
          checked={showMessageTimestamps}
          title={t('settings.options.showMessageTimestamps.title')}
          onCheckedChange={onToggleShowMessageTimestamps}
          disabled={isInteractionLocked}
        />
        <SettingsToggleRow
          checked={wrapCodeBlocks}
          title={t('settings.options.wrapCodeBlocks.title')}
          onCheckedChange={onToggleWrapCodeBlocks}
          disabled={isInteractionLocked}
        />
      </div>
    </SettingsCard>
  </Field>
);

export default MessageSettingsCard;

