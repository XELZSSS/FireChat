import { TavilyConfig } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import {
  buildSearchMcpPayload,
  normalizeSearchMcpResponse,
  resolveSearchEngine,
} from '@/infrastructure/providers/tavilyConfig';

export {
  getDefaultTavilyConfig,
  normalizeTavilyConfig,
} from '@/infrastructure/providers/tavilyConfig';

export const hasSearchConfig = (config?: TavilyConfig): boolean => {
  if (!config) return false;

  switch (resolveSearchEngine(config)) {
    case 'exa':
      return true;
    case 'firecrawl':
      return Boolean(config.apiKey);
    case 'searxng':
      return Boolean(config.searxngBaseUrl);
    case 'tavily':
    default:
      return Boolean(config.apiKey);
  }
};

export const callTavilySearch = async (
  tavilyConfig: TavilyConfig | undefined,
  args: {
    query: string;
    search_depth?: TavilyConfig['searchDepth'];
    max_results?: number;
    topic?: TavilyConfig['topic'];
  }
): Promise<unknown> => {
  const activeConfig = tavilyConfig;
  if (!activeConfig || !hasSearchConfig(activeConfig)) {
    throw new Error(t('settings.search.error.missingApiKey'));
  }
  const engine = resolveSearchEngine(activeConfig);
  const bridge = window.firechat?.mcp;
  if (!bridge) {
    throw new Error(t('settings.search.error.requestFailed'));
  }

  const result = await bridge.callSearch(
    buildSearchMcpPayload(activeConfig, {
      query: args.query,
      search_depth: args.search_depth,
      max_results: args.max_results,
      topic: args.topic,
    })
  );

  if (result.isError) {
    const message = result.content
      .map((item) =>
        item && typeof item === 'object' && 'text' in item ? String(item.text ?? '') : ''
      )
      .filter(Boolean)
      .join('\n');
    throw new Error(message || t('settings.search.error.requestFailed'));
  }

  return normalizeSearchMcpResponse(engine, result);
};
