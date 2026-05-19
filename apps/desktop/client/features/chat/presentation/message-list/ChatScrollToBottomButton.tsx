import { memo } from 'react';
import { IconButton } from '@/shared/ui';
import { KeyboardArrowDownIcon } from '@/shared/ui/icons';
import { t } from '@/shared/utils/i18n';
import { CHAT_INPUT_BUTTON_OFFSET } from '@client/features/chat/presentation/shell/chatMainConstants';

const SCROLL_BUTTON_WRAPPER_CLASS = 'mx-auto flex w-full max-w-[min(50rem,100%)] justify-end px-4';
const SCROLL_BUTTON_CLASS =
  'pointer-events-auto border-[var(--line-1)] bg-[var(--bg-1)] text-[var(--ink-2)] shadow-none hover:bg-[var(--bg-1)] hover:text-[var(--ink-1)]';

type ChatScrollToBottomButtonProps = {
  onJumpToBottom: () => void;
};

const ChatScrollToBottomButton = memo(function ChatScrollToBottomButton({
  onJumpToBottom,
}: ChatScrollToBottomButtonProps) {
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{ bottom: CHAT_INPUT_BUTTON_OFFSET }}
    >
      <div className={SCROLL_BUTTON_WRAPPER_CLASS}>
        <IconButton
          onClick={onJumpToBottom}
          variant="subtle"
          className={SCROLL_BUTTON_CLASS}
          aria-label={t('chat.scrollToBottom')}
          title={t('chat.scrollToBottom')}
        >
          <KeyboardArrowDownIcon size={18} strokeWidth={2} />
        </IconButton>
      </div>
    </div>
  );
});

export default ChatScrollToBottomButton;
