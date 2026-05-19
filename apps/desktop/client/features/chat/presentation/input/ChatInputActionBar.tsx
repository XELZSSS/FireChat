import { memo, type ReactNode, type Ref } from 'react';
import {
  AttachFileIcon,
  MoodIcon,
  PsychologyAltOutlinedIcon,
  SendRoundedIcon,
  StopCircleOutlinedIcon,
} from '@/shared/ui/icons';
import { t } from '@/shared/utils/i18n';
import { ChatInputActionButton } from '@client/features/chat/presentation/input/chatInputParts';
import type { ReasoningLevel } from '@/infrastructure/providers/types';

type ActionButtonConfig = {
  key: string;
  disabled: boolean;
  label: string;
  toneClassName: string;
  onClick: () => void;
  icon: ReactNode;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
};

type ChatInputActionBarProps = {
  isInputDisabled: boolean;
  isStreaming: boolean;
  isSendDisabled: boolean;
  reasoningControlVisible: boolean;
  reasoningEnabled: boolean;
  reasoningLevel: ReasoningLevel;
  reasoningLevelOptions: ReasoningLevel[];
  reasoningLevelSupported: boolean;
  reasoningToggleLocked: boolean;
  showEmojiButton: boolean;
  emojiPickerOpen: boolean;
  attachmentButtonToneClass: string;
  reasoningButtonToneClass: string;
  sendButtonToneClass: string;
  emojiButtonToneClass: string;
  onOpenFilePicker: () => void;
  onToggleEmojiPicker: () => void;
  onToggleReasoning: () => void;
  onReasoningLevelChange: (level: ReasoningLevel) => void;
  onSendClick: () => void;
  emojiButtonRef?: Ref<HTMLButtonElement>;
};

const isDeepSeekReasoningLevelOptions = (levels: ReasoningLevel[]): boolean =>
  levels.length === 2 && levels.includes('high') && levels.includes('xhigh');

const getReasoningLevelLabel = (level: ReasoningLevel, levels: ReasoningLevel[]): string => {
  if (level === 'xhigh' && isDeepSeekReasoningLevelOptions(levels)) {
    return 'max';
  }

  return t(`input.reasoning.level.${level}`);
};

const ReasoningLevelControl = ({
  value,
  options,
  disabled,
  onChange,
}: {
  value: ReasoningLevel;
  options: ReasoningLevel[];
  disabled: boolean;
  onChange: (level: ReasoningLevel) => void;
}) => {
  return (
    <div
      className={`ml-0.5 inline-flex h-8 shrink-0 items-center gap-0.5 border border-[var(--line-1)] bg-transparent p-0.5${
        disabled ? ' opacity-50' : ''
      }`}
    >
      {options.map((level) => {
        const selected = level === value;
        const label = getReasoningLevelLabel(level, options);

        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            title={label}
            onClick={() => onChange(level)}
            className={`inline-flex h-7 min-w-10 items-center justify-center px-2 text-[12px] leading-none transition-colors duration-[var(--motion-base)] ease-[var(--motion-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              selected
                ? 'bg-[var(--bg-2)] text-[var(--accent)]'
                : 'text-[var(--ink-3)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-1)]'
            }${disabled ? ' cursor-not-allowed' : ''}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export const ChatInputActionBar = memo(function ChatInputActionBar({
  isInputDisabled,
  isStreaming,
  isSendDisabled,
  reasoningControlVisible,
  reasoningEnabled,
  reasoningLevel,
  reasoningLevelOptions,
  reasoningLevelSupported,
  reasoningToggleLocked,
  showEmojiButton,
  emojiPickerOpen,
  attachmentButtonToneClass,
  reasoningButtonToneClass,
  sendButtonToneClass,
  emojiButtonToneClass,
  onOpenFilePicker,
  onToggleEmojiPicker,
  onToggleReasoning,
  onReasoningLevelChange,
  onSendClick,
  emojiButtonRef,
}: ChatInputActionBarProps) {
  const actionButtons: ActionButtonConfig[] = [
    {
      key: 'attachment',
      onClick: onOpenFilePicker,
      disabled: isInputDisabled,
      label: t('input.attach.open'),
      toneClassName: attachmentButtonToneClass,
      icon: <AttachFileIcon size={18} strokeWidth={2} />,
    },
  ];

  if (reasoningControlVisible) {
    actionButtons.push({
      key: 'reasoning',
      onClick: reasoningToggleLocked ? () => undefined : onToggleReasoning,
      disabled: isInputDisabled,
      label: reasoningToggleLocked
        ? t('input.reasoning.fixed')
        : reasoningEnabled
          ? t('input.reasoning.disable')
          : t('input.reasoning.enable'),
      toneClassName: reasoningButtonToneClass,
      icon: <PsychologyAltOutlinedIcon size={18} strokeWidth={2} />,
      ariaPressed: reasoningToggleLocked ? true : reasoningEnabled,
    });
  }

  if (showEmojiButton) {
    actionButtons.push({
      key: 'emoji',
      buttonRef: emojiButtonRef,
      onClick: onToggleEmojiPicker,
      disabled: isInputDisabled,
      label: t('input.emoji.open'),
      toneClassName: emojiButtonToneClass,
      icon: <MoodIcon size={18} strokeWidth={2} />,
      ariaPressed: emojiPickerOpen,
      ariaExpanded: emojiPickerOpen,
    });
  }

  actionButtons.push({
    key: 'send',
    onClick: onSendClick,
    disabled: isSendDisabled,
    label: isStreaming ? t('input.stop') : t('input.send'),
    toneClassName: sendButtonToneClass,
    icon: isStreaming ? (
      <StopCircleOutlinedIcon size={18} strokeWidth={2} />
    ) : (
      <SendRoundedIcon size={18} strokeWidth={2} />
    ),
  });
  const sendButton = actionButtons.find((button) => button.key === 'send');
  const leadingButtons = actionButtons.filter((button) => button.key !== 'send');

  return (
    <div className="flex w-full items-center gap-1.5 px-1 pt-0.5">
      {leadingButtons.map((button) => (
        <ChatInputActionButton
          key={button.key}
          buttonRef={button.buttonRef}
          onClick={button.onClick}
          disabled={button.disabled}
          label={button.label}
          toneClassName={button.toneClassName}
          ariaPressed={button.ariaPressed}
          ariaExpanded={button.ariaExpanded}
        >
          {button.icon}
        </ChatInputActionButton>
      ))}
      {reasoningControlVisible && reasoningLevelSupported ? (
        <ReasoningLevelControl
          value={reasoningLevel}
          options={reasoningLevelOptions}
          disabled={isInputDisabled}
          onChange={onReasoningLevelChange}
        />
      ) : null}
      {sendButton ? (
        <div className="ml-auto">
          <ChatInputActionButton
            buttonRef={sendButton.buttonRef}
            onClick={sendButton.onClick}
            disabled={sendButton.disabled}
            label={sendButton.label}
            toneClassName={sendButton.toneClassName}
            ariaPressed={sendButton.ariaPressed}
            ariaExpanded={sendButton.ariaExpanded}
          >
            {sendButton.icon}
          </ChatInputActionButton>
        </div>
      ) : null}
    </div>
  );
});

