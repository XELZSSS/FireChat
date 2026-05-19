export type {
  ProcessResponseStreamEventOptions,
  ProcessedResponseStreamEvent,
  ResponseFunctionCallItem,
  ResponseFunctionTool,
  ResponseInputMessage,
  ResponseNamespaceTool,
  ResponseStreamEvent,
  ResponseToolCallArgs,
  ResponseToolDefinition,
  ResponseToolExecutionMessages,
  ResponseToolSearchTool,
  ResponseUsagePayload,
} from '@/infrastructure/providers/responsesSharedTypes';

export {
  processResponseStreamEvent,
  supportsHostedToolSearch,
  supportsResponseReasoningSummary,
} from '@/infrastructure/providers/responsesSharedStream';

import type { ResponseInputMessage } from '@/infrastructure/providers/responsesSharedTypes';
import { buildMessagePromptContent } from '@/shared/utils/chatAttachments';
import { buildRuntimeSystemPrompt } from '@/infrastructure/providers/runtimeContext';

export const toResponseInputMessages = (
  messages: Array<{
    role: 'user' | 'model';
    text: string;
    attachments?: import('@/shared/types/chat').ChatAttachment[];
    isError?: boolean;
  }>,
  systemPrompt?: string
): ResponseInputMessage[] => {
  const runtimeSystemPrompt = buildRuntimeSystemPrompt(systemPrompt);
  const responseMessages = messages
    .filter((msg) => !msg.isError)
    .map((msg) => ({
      type: 'message' as const,
      role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: [
        {
          type: msg.role === 'user' ? ('input_text' as const) : ('output_text' as const),
          text: buildMessagePromptContent(msg),
        },
      ],
    }));

  return [
    {
      type: 'message',
      role: 'system',
      content: [{ type: 'input_text', text: runtimeSystemPrompt }],
    },
    ...responseMessages,
  ];
};
