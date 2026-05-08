import type { ProviderStreamResult, SdkStreamTextResult } from '@provider-core/index';

export type { ProviderStreamResult };

export const streamSdkResult = async function* ({
  result,
  emitReasoning,
  rawReasoningExtractor,
}: {
  result: SdkStreamTextResult;
  emitReasoning: boolean;
  rawReasoningExtractor?: (raw: unknown) => string[];
}): AsyncGenerator<string, ProviderStreamResult, unknown> {
  let fullResponse = '';
  let fullReasoning = '';
  let lastResponseId: string | undefined;

  const readChunkDelta = (chunk: Record<string, unknown>): string => {
    const text = chunk.text;
    if (typeof text === 'string' && text.length > 0) {
      return text;
    }

    const delta = chunk.delta;
    if (typeof delta === 'string' && delta.length > 0) {
      return delta;
    }

    return '';
  };

  const extractErrorText = (value: unknown, depth = 0): string => {
    if (depth > 3 || value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    if (value instanceof Error) {
      return (
        value.message.trim() ||
        extractErrorText((value as Error & { cause?: unknown }).cause, depth + 1)
      );
    }

    if (typeof value !== 'object') {
      return '';
    }

    const record = value as Record<string, unknown>;
    for (const key of ['errorText', 'message', 'error', 'cause']) {
      const nested = extractErrorText(record[key], depth + 1);
      if (nested) {
        return nested;
      }
    }

    if ('type' in record && record.type === 'error') {
      try {
        return JSON.stringify(record);
      } catch {
        return '';
      }
    }

    return '';
  };

  const toStreamErrorMessage = (chunk: Record<string, unknown>, defaultMessage: string): string => {
    const errorText = extractErrorText(chunk);
    if (errorText) {
      return errorText;
    }

    throw new Error(defaultMessage);
  };

  for await (const chunk of result.fullStream) {
    const streamChunk = chunk as Record<string, unknown> & { type?: string };

    if (streamChunk.type === 'text-delta') {
      const text = readChunkDelta(streamChunk);
      if (!text) {
        continue;
      }
      fullResponse += text;
      yield text;
      continue;
    }

    if (emitReasoning && streamChunk.type === 'reasoning-delta') {
      const reasoningText = readChunkDelta(streamChunk);
      if (!reasoningText) {
        continue;
      }
      fullReasoning += reasoningText;
      yield `<think>${reasoningText}</think>`;
      continue;
    }

    if (emitReasoning && streamChunk.type === 'raw' && rawReasoningExtractor) {
      for (const reasoningText of rawReasoningExtractor(streamChunk.rawValue)) {
        if (!reasoningText) {
          continue;
        }
        fullReasoning += reasoningText;
        yield `<think>${reasoningText}</think>`;
      }
      continue;
    }

    if (streamChunk.type === 'error') {
      throw new Error(toStreamErrorMessage(streamChunk, 'The model request failed.'));
    }

    if (streamChunk.type === 'tool-input-error') {
      const toolName =
        typeof streamChunk.toolName === 'string' && streamChunk.toolName.trim().length > 0
          ? streamChunk.toolName
          : 'tool';
      throw new Error(
        toStreamErrorMessage(streamChunk, `The model produced invalid input for ${toolName}.`)
      );
    }

    if (streamChunk.type === 'tool-output-error') {
      throw new Error(
        toStreamErrorMessage(streamChunk, 'A tool call failed while processing the response.')
      );
    }

    if (streamChunk.type === 'finish-step') {
      const response = streamChunk.response;
      lastResponseId =
        typeof response === 'object' &&
        response !== null &&
        typeof (response as { id?: unknown }).id === 'string'
          ? (response as { id: string }).id
          : undefined;
    }
  }

  return {
    fullResponse,
    fullReasoning,
    lastResponseId,
  };
};
