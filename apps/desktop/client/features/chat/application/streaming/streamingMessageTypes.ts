import type { ChatMessage } from '@/shared/types/chat';
import type { MessageOverrides } from '@client/features/chat/application/streaming/streamingMessageHelpers';

export type StreamingMessageUpdate = {
  modelMessageId: string;
  text: string;
  reasoning?: string;
};

export type StreamingMessagePart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'reasoning';
      text: string;
    }
  | {
      type: 'citations';
      citations?: MessageOverrides['citations'];
    };

export type StreamingMessageEvent =
  | {
      type: 'message.updated';
      properties: {
        modelMessageId: string;
      };
    }
  | {
      type: 'message.part.updated';
      properties: {
        modelMessageId: string;
        part: StreamingMessagePart;
        delta?: string;
      };
    };

export type HandleSendMessageOptions = {
  onStarted?: (payload: { modelMessageId: string; userMessage?: ChatMessage }) => void;
  onMessageUpdated?: (payload: StreamingMessageUpdate) => void;
  onEvent?: (event: StreamingMessageEvent) => void;
};

export type HandleSendMessageResult = {
  status: 'completed' | 'aborted' | 'error';
  modelMessageId: string;
  message?: ChatMessage;
  errorMessage?: string;
};
