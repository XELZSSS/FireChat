import type { ModelMessage } from 'ai';
import { ChatMessage, Role } from '@/shared/types/chat';
import { buildMessagePromptContent } from '@/shared/utils/chatAttachments';
import { normalizeCustomHeaders } from '@/infrastructure/providers/headerUtils';

export type HeaderPair = { key: string; value: string };

export const supportsStandardReasoningEffort = (modelName: string): boolean => {
  const normalized = modelName.trim().toLowerCase();
  return (
    normalized.startsWith('gpt-5') ||
    normalized.startsWith('o') ||
    normalized.includes('reasoning') ||
    normalized.includes('reasoner')
  );
};

export const toModelMessages = (messages: ChatMessage[], systemPrompt?: string): ModelMessage[] => {
  const modelMessages = messages
    .filter((message) => !message.isError)
    .map((message) => ({
      role: message.role === Role.User ? ('user' as const) : ('assistant' as const),
      content: buildMessagePromptContent(message),
    }));

  return systemPrompt?.trim()
    ? [{ role: 'system' as const, content: systemPrompt.trim() }, ...modelMessages]
    : modelMessages;
};

export const normalizeHeaderRecord = (headers?: HeaderPair[]): Record<string, string> => {
  const record: Record<string, string> = {};
  for (const header of normalizeCustomHeaders(headers)) {
    record[header.key] = header.value;
  }
  return record;
};

export const extractReasoningDetailsFromOpenAIRawChunk = (raw: unknown): string[] => {
  const details =
    (
      raw as {
        choices?: Array<{
          delta?: { reasoning_details?: Array<{ text?: string }> };
          message?: { reasoning_details?: Array<{ text?: string }> };
        }>;
      }
    )?.choices?.[0]?.delta?.reasoning_details ??
    (
      raw as {
        choices?: Array<{
          delta?: { reasoning_details?: Array<{ text?: string }> };
          message?: { reasoning_details?: Array<{ text?: string }> };
        }>;
      }
    )?.choices?.[0]?.message?.reasoning_details;

  if (!Array.isArray(details)) {
    return [];
  }

  return details
    .map((detail) => (typeof detail?.text === 'string' ? detail.text : ''))
    .filter(Boolean);
};
