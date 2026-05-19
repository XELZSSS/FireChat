import { Role, type ChatMessage } from '@/shared/types/chat';
import { MESSAGE_OVERSCAN_PX } from '@client/features/chat/presentation/shell/chatMainConstants';

export const getStreamingMessageId = (
  messages: ChatMessage[],
  isStreaming: boolean
): string | null => {
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  return isStreaming && lastMessage?.role === Role.Model ? lastMessage.id : null;
};

export const findVisibleMessageRange = ({
  offsets,
  heights,
  scrollTop,
  viewportHeight,
}: {
  offsets: number[];
  heights: number[];
  scrollTop: number;
  viewportHeight: number;
}) => {
  if (offsets.length === 0) {
    return {
      start: 0,
      end: 0,
    };
  }

  const startBoundary = Math.max(0, scrollTop - MESSAGE_OVERSCAN_PX);
  const endBoundary = scrollTop + viewportHeight + MESSAGE_OVERSCAN_PX;
  let low = 0;
  let high = offsets.length - 1;
  let start = high;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (offsets[mid] + heights[mid] < startBoundary) {
      low = mid + 1;
    } else {
      start = mid;
      high = mid - 1;
    }
  }

  low = start;
  high = offsets.length - 1;
  let end = start;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (offsets[mid] > endBoundary) {
      high = mid - 1;
    } else {
      end = mid;
      low = mid + 1;
    }
  }

  const lastIndex = Math.max(0, offsets.length - 1);
  const clampedStart = Math.min(start, lastIndex);

  return {
    start: clampedStart,
    end: Math.max(clampedStart, Math.min(end, lastIndex)),
  };
};
