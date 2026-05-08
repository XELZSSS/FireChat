import {
  supportsHostedToolSearch,
  supportsResponseReasoningSummary,
} from '@/infrastructure/providers/responsesShared';
import { extractReasoningDetailsFromOpenAIRawChunk } from '@/infrastructure/providers/aiSdkProviderMessages';

export { toModelMessages } from '@/infrastructure/providers/aiSdkProviderMessages';
export {
  buildProviderOptionsRecord,
  buildToolSet,
} from '@/infrastructure/providers/aiSdkProviderTools';
export { streamSdkResult } from '@/infrastructure/providers/aiSdkProviderStreaming';
export { AISdkOpenAICompatibleProviderBase } from '@/infrastructure/providers/aiSdkOpenAICompatibleProviderBase';
export { AISdkOpenAIResponsesProviderBase } from '@/infrastructure/providers/aiSdkOpenAIResponsesProviderBase';

export const getOpenAIReasoningDetailsFromRawChunk = extractReasoningDetailsFromOpenAIRawChunk;
export const getSupportsHostedToolSearch = supportsHostedToolSearch;
export const getSupportsResponseReasoningSummary = supportsResponseReasoningSummary;
