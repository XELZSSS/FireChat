import type { TavilySearchDepth, TavilyTopic } from '@/shared/types/chat';
import {
  DEFAULT_MAX_TOOL_CALL_ROUNDS,
  MAX_TOOL_CALL_ROUNDS,
  MIN_TOOL_CALL_ROUNDS,
} from '@/infrastructure/providers/utils';

export type AdaptiveToolRequest = {
  query?: string;
  search_depth?: TavilySearchDepth;
  max_results?: number;
  topic?: TavilyTopic;
};

export type RequestPolicyMode = 'serial' | 'balanced' | 'aggressive';

export type RequestPolicy = {
  mode: RequestPolicyMode;
  toolParallelism: number;
  toolCallMaxRounds: number;
  reason: string;
};

const MAX_ADAPTIVE_TOOL_PARALLELISM = 3;
const LONG_QUERY_THRESHOLD = 80;
const SEARCH_INTENT_PATTERN =
  /最新|搜索|查一下|查证|对比|新闻|资料|来源|联网|web|search|latest|news|compare|source|research/i;

const clampParallelism = (value: number, requestCount: number): number => {
  return Math.max(1, Math.min(value, requestCount, MAX_ADAPTIVE_TOOL_PARALLELISM));
};

const buildRequestPolicy = (
  mode: RequestPolicyMode,
  toolParallelism: number,
  reason: string,
  toolCallMaxRounds = DEFAULT_MAX_TOOL_CALL_ROUNDS
): RequestPolicy => ({
  mode,
  toolParallelism,
  toolCallMaxRounds: normalizeToolCallMaxRounds(toolCallMaxRounds),
  reason,
});

export const normalizeToolCallMaxRounds = (value: unknown): number => {
  const parsed =
    typeof value === 'string' || typeof value === 'number'
      ? Number.parseInt(String(value), 10)
      : DEFAULT_MAX_TOOL_CALL_ROUNDS;

  if (!Number.isFinite(parsed)) {
    return DEFAULT_MAX_TOOL_CALL_ROUNDS;
  }

  return Math.min(Math.max(parsed, MIN_TOOL_CALL_ROUNDS), MAX_TOOL_CALL_ROUNDS);
};

export const getRequestPolicyToolCallMaxRounds = (policy?: RequestPolicy): number =>
  normalizeToolCallMaxRounds(policy?.toolCallMaxRounds);

export const decideAdaptiveToolParallelism = (requests: AdaptiveToolRequest[]): number => {
  if (requests.length <= 1) return 1;

  const hasComplexIntent = requests.some((request) => {
    const queryLength = request.query?.trim().length ?? 0;
    return (
      queryLength >= LONG_QUERY_THRESHOLD ||
      request.search_depth === 'advanced' ||
      request.search_depth === 'ultra-fast' ||
      (request.max_results ?? 0) >= 8 ||
      request.topic === 'news'
    );
  });

  const desired = hasComplexIntent || requests.length >= 3 ? 3 : 2;
  return clampParallelism(desired, requests.length);
};

export const decideRequestPolicyFromPrompt = (
  message: string,
  options: { toolCallMaxRounds?: string | number } = {}
): RequestPolicy => {
  const normalized = message.trim();
  const length = normalized.length;
  const hasSearchIntent = SEARCH_INTENT_PATTERN.test(normalized);
  const isComplexTask = length >= 120 || /\n|-\s|\d+\.|；|;/.test(normalized);
  const toolCallMaxRounds = normalizeToolCallMaxRounds(options.toolCallMaxRounds);

  if (hasSearchIntent && isComplexTask) {
    return buildRequestPolicy('aggressive', 3, 'search-intent-and-complex-task', toolCallMaxRounds);
  }

  if (hasSearchIntent || length >= LONG_QUERY_THRESHOLD) {
    return buildRequestPolicy(
      'balanced',
      2,
      hasSearchIntent ? 'search-intent' : 'long-query',
      toolCallMaxRounds
    );
  }

  return buildRequestPolicy('serial', 1, 'default', toolCallMaxRounds);
};
