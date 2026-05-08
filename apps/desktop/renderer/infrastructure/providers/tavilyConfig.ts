import { TavilyConfig } from '@/shared/types/chat';
import { getRuntimeEnvValue } from '@/infrastructure/config/runtimeEnv';
import { sanitizeApiKey } from '@/infrastructure/providers/utils';

const clampSearchMaxResults = (value: number): number =>
  Math.min(Math.max(Math.round(value), 1), 20);

const SEARXNG_TIME_RANGES = new Set<TavilyConfig['searxngTimeRange']>(['day', 'month', 'year']);
const SEARXNG_SAFE_SEARCH_VALUES = new Set<TavilyConfig['searxngSafeSearch']>([0, 1, 2]);

const trimOptionalText = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeCountryCode = (value?: string): string | undefined => {
  const normalized = trimOptionalText(value)?.toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : undefined;
};

export const resolveSearchEngine = (config?: TavilyConfig): NonNullable<TavilyConfig['engine']> =>
  config?.engine === 'exa' || config?.engine === 'searxng' || config?.engine === 'firecrawl'
    ? config.engine
    : 'tavily';

export const normalizeSearxngBaseUrl = (value?: string): string | undefined => {
  const raw = value?.trim();
  if (!raw) return undefined;

  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return undefined;
    }
    url.hash = '';
    url.search = '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    if (url.pathname.endsWith('/search')) {
      url.pathname = url.pathname.slice(0, -'/search'.length) || '/';
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
};

export const buildSearchMcpPayload = (
  tavilyConfig: TavilyConfig,
  args: {
    query: string;
    search_depth?: TavilyConfig['searchDepth'];
    max_results?: number;
    topic?: TavilyConfig['topic'];
  }
) => ({
  engine: resolveSearchEngine(tavilyConfig),
  query: args.query,
  maxResults: clampSearchMaxResults(args.max_results ?? tavilyConfig.maxResults ?? 5),
  apiKey: tavilyConfig.apiKey,
  searchDepth: args.search_depth ?? tavilyConfig.searchDepth ?? 'basic',
  topic: args.topic ?? tavilyConfig.topic ?? 'general',
  searxngBaseUrl: tavilyConfig.searxngBaseUrl,
  searxngLanguage: tavilyConfig.searxngLanguage,
  searxngTimeRange: tavilyConfig.searxngTimeRange,
  searxngSafeSearch: tavilyConfig.searxngSafeSearch,
  firecrawlLocation: tavilyConfig.firecrawlLocation,
  firecrawlCountry: tavilyConfig.firecrawlCountry,
  firecrawlScrapeContent: tavilyConfig.firecrawlScrapeContent,
});

const normalizeMcpTextValue = (value: unknown): string =>
  typeof value === 'string' && value !== 'N/A' ? value.trim() : '';

const extractMcpTextContent = (payload: unknown): string => {
  const raw = (payload ?? {}) as {
    content?: Array<{
      type?: unknown;
      text?: unknown;
    }>;
  };
  return Array.isArray(raw.content)
    ? raw.content
        .filter((item) => item?.type === 'text' && typeof item.text === 'string')
        .map((item) => item.text)
        .join('\n\n')
    : '';
};

const parseExaMcpResults = (contentText: string) => {
  return contentText
    .split(/\n\s*---\s*\n/g)
    .map((block) => {
      const title = normalizeMcpTextValue(block.match(/^Title:\s*(.*)$/m)?.[1]);
      const url = normalizeMcpTextValue(block.match(/^URL:\s*(.*)$/m)?.[1]);
      const publishedDate = normalizeMcpTextValue(block.match(/^Published:\s*(.*)$/m)?.[1]);
      const author = normalizeMcpTextValue(block.match(/^Author:\s*(.*)$/m)?.[1]);
      const text = normalizeMcpTextValue(block.split(/^Highlights:\s*$/m)[1]);

      return {
        title,
        url,
        publishedDate: publishedDate || undefined,
        author: author || undefined,
        text: text || undefined,
      };
    })
    .filter((result) => result.title || result.url || result.text);
};

export const normalizeSearchMcpResponse = (
  engine: NonNullable<TavilyConfig['engine']>,
  payload: unknown
) => {
  const raw = (payload ?? {}) as {
    structuredContent?: Record<string, unknown>;
  };
  const contentText = extractMcpTextContent(payload);

  return {
    engine,
    transport: 'mcp' as const,
    text: contentText || undefined,
    structuredContent: raw.structuredContent,
    results: engine === 'exa' ? parseExaMcpResults(contentText) : undefined,
  };
};

export const normalizeTavilyConfig = (value?: TavilyConfig): TavilyConfig | undefined => {
  if (!value) return undefined;
  const engine = resolveSearchEngine(value);
  const apiKey = sanitizeApiKey(value.apiKey);
  const searchDepth = value.searchDepth;
  const maxResults =
    typeof value.maxResults === 'number' && Number.isFinite(value.maxResults)
      ? clampSearchMaxResults(value.maxResults)
      : undefined;
  const topic = value.topic === 'news' ? value.topic : undefined;
  const searxngBaseUrl = normalizeSearxngBaseUrl(value.searxngBaseUrl);
  const searxngLanguage = trimOptionalText(value.searxngLanguage);
  const searxngTimeRange = SEARXNG_TIME_RANGES.has(value.searxngTimeRange)
    ? value.searxngTimeRange
    : undefined;
  const searxngSafeSearch = SEARXNG_SAFE_SEARCH_VALUES.has(value.searxngSafeSearch)
    ? value.searxngSafeSearch
    : undefined;
  const firecrawlLocation = trimOptionalText(value.firecrawlLocation);
  const firecrawlCountry = normalizeCountryCode(value.firecrawlCountry);
  const firecrawlScrapeContent = value.firecrawlScrapeContent ?? undefined;

  if (
    !apiKey &&
    !searchDepth &&
    !maxResults &&
    !topic &&
    engine !== 'exa' &&
    !searxngBaseUrl &&
    !searxngLanguage &&
    !searxngTimeRange &&
    searxngSafeSearch === undefined &&
    !firecrawlLocation &&
    !firecrawlCountry &&
    firecrawlScrapeContent === undefined
  ) {
    return undefined;
  }

  return {
    engine,
    apiKey,
    searchDepth,
    maxResults,
    topic,
    searxngBaseUrl,
    searxngLanguage,
    searxngTimeRange,
    searxngSafeSearch,
    firecrawlLocation,
    firecrawlCountry,
    firecrawlScrapeContent,
  };
};

export const getDefaultTavilyConfig = (): TavilyConfig | undefined => {
  const exaApiKey = sanitizeApiKey(getRuntimeEnvValue('EXA_API_KEY'));
  const rawExaMaxResults = getRuntimeEnvValue('EXA_MAX_RESULTS');

  return normalizeTavilyConfig({
    engine: 'exa',
    apiKey: exaApiKey,
    maxResults: rawExaMaxResults ? Number.parseInt(rawExaMaxResults, 10) : undefined,
  });
};
