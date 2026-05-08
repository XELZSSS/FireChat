const SEARCH_TIME_RANGE_VALUES = ['day', 'week', 'month', 'year'] as const;
const SCRAPE_MODE_VALUES = ['fast', 'stealth', 'dynamic'] as const;

const SEARCH_PARAMETERS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    query: { type: 'string', description: 'Search query' },
    num_results: {
      type: 'integer',
      minimum: 1,
      maximum: 20,
      description: 'Number of results to return',
    },
    language: {
      type: 'string',
      description: 'Language code such as en, zh-CN, or ja',
    },
    time_range: {
      type: 'string',
      enum: SEARCH_TIME_RANGE_VALUES,
      description: 'Optional time range filter',
    },
  },
  required: ['query'],
} as const;

const IMAGE_SEARCH_PARAMETERS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    query: { type: 'string', description: 'Image search query' },
    num_results: {
      type: 'integer',
      minimum: 1,
      maximum: 20,
      description: 'Number of images to return',
    },
  },
  required: ['query'],
} as const;

const SCRAPE_PARAMETERS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    url: {
      type: 'string',
      description: 'HTTP or HTTPS URL to scrape',
    },
    mode: {
      type: 'string',
      enum: SCRAPE_MODE_VALUES,
      description: 'Scraping mode',
    },
    extract_links: {
      type: 'boolean',
      description: 'Include extracted links',
    },
    extract_images: {
      type: 'boolean',
      description: 'Include extracted image URLs',
    },
    extract_meta: {
      type: 'boolean',
      description: 'Include page metadata',
    },
  },
  required: ['url'],
} as const;

const PAGE_TO_MARKDOWN_PARAMETERS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    url: {
      type: 'string',
      description: 'HTTP or HTTPS URL to convert to Markdown',
    },
    mode: {
      type: 'string',
      enum: SCRAPE_MODE_VALUES,
      description: 'Scraping mode',
    },
  },
  required: ['url'],
} as const;

const CRAWL_PARAMETERS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    url: {
      type: 'string',
      description: 'Start URL for the crawl',
    },
    max_pages: {
      type: 'integer',
      minimum: 1,
      maximum: 20,
      description: 'Maximum pages to crawl',
    },
    max_depth: {
      type: 'integer',
      minimum: 0,
      maximum: 5,
      description: 'Maximum crawl depth',
    },
    same_domain: {
      type: 'boolean',
      description: 'Keep crawling within the same domain only',
    },
  },
  required: ['url'],
} as const;

const clampNumber = (value: unknown, defaultValue: number, min: number, max: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }

  return Math.min(Math.max(parsed, min), max);
};

const trimText = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

type OpenAdapterToolRequiredField = 'query' | 'url';

export type OpenAdapterToolDefinition = {
  key: string;
  runtimeName: string;
  labelKey: string;
  descriptionKey: string;
  runtimeDescription: string;
  endpoint: string;
  parameters: Record<string, unknown>;
  requiredField: OpenAdapterToolRequiredField;
  defaultEnabled: boolean;
  buildRequestBody: (input: Record<string, unknown>) => Record<string, unknown> | null;
};

export const OPENADAPTER_TOOL_DEFINITIONS = [
  {
    key: 'webSearch',
    runtimeName: 'web_search',
    labelKey: 'settings.modal.openadapterTools.webSearch.title',
    descriptionKey: 'settings.modal.openadapterTools.webSearch.description',
    runtimeDescription:
      'Search the web and return titles, URLs, snippets, and suggestions for current public information.',
    endpoint: '/v1/tools/search',
    parameters: SEARCH_PARAMETERS_JSON_SCHEMA as Record<string, unknown>,
    requiredField: 'query',
    defaultEnabled: true,
    buildRequestBody: (input) => {
      const query = trimText(input.query);
      if (!query) {
        return null;
      }

      return {
        query,
        num_results: clampNumber(input.num_results, 8, 1, 20),
        language: trimText(input.language) || 'en',
        ...(input.time_range ? { time_range: input.time_range } : {}),
      };
    },
  },
  {
    key: 'imageSearch',
    runtimeName: 'image_search',
    labelKey: 'settings.modal.openadapterTools.imageSearch.title',
    descriptionKey: 'settings.modal.openadapterTools.imageSearch.description',
    runtimeDescription:
      'Search for images and return titles, source pages, thumbnails, and direct image URLs.',
    endpoint: '/v1/tools/search/images',
    parameters: IMAGE_SEARCH_PARAMETERS_JSON_SCHEMA as Record<string, unknown>,
    requiredField: 'query',
    defaultEnabled: true,
    buildRequestBody: (input) => {
      const query = trimText(input.query);
      if (!query) {
        return null;
      }

      return {
        query,
        num_results: clampNumber(input.num_results, 8, 1, 20),
      };
    },
  },
  {
    key: 'newsSearch',
    runtimeName: 'news_search',
    labelKey: 'settings.modal.openadapterTools.newsSearch.title',
    descriptionKey: 'settings.modal.openadapterTools.newsSearch.description',
    runtimeDescription:
      'Search recent news and return headlines, article URLs, snippets, and publication dates.',
    endpoint: '/v1/tools/search/news',
    parameters: SEARCH_PARAMETERS_JSON_SCHEMA as Record<string, unknown>,
    requiredField: 'query',
    defaultEnabled: true,
    buildRequestBody: (input) => {
      const query = trimText(input.query);
      if (!query) {
        return null;
      }

      return {
        query,
        num_results: clampNumber(input.num_results, 8, 1, 20),
        ...(input.time_range ? { time_range: input.time_range } : {}),
      };
    },
  },
  {
    key: 'videoSearch',
    runtimeName: 'video_search',
    labelKey: 'settings.modal.openadapterTools.videoSearch.title',
    descriptionKey: 'settings.modal.openadapterTools.videoSearch.description',
    runtimeDescription:
      'Search for videos and return titles, URLs, thumbnails, duration, and channel info.',
    endpoint: '/v1/tools/search/videos',
    parameters: IMAGE_SEARCH_PARAMETERS_JSON_SCHEMA as Record<string, unknown>,
    requiredField: 'query',
    defaultEnabled: true,
    buildRequestBody: (input) => {
      const query = trimText(input.query);
      if (!query) {
        return null;
      }

      return {
        query,
        num_results: clampNumber(input.num_results, 8, 1, 20),
      };
    },
  },
  {
    key: 'scrapeUrl',
    runtimeName: 'scrape_url',
    labelKey: 'settings.modal.openadapterTools.scrapeUrl.title',
    descriptionKey: 'settings.modal.openadapterTools.scrapeUrl.description',
    runtimeDescription:
      'Scrape a webpage and return its text, metadata, links, and image URLs for analysis.',
    endpoint: '/v1/tools/scrape',
    parameters: SCRAPE_PARAMETERS_JSON_SCHEMA as Record<string, unknown>,
    requiredField: 'url',
    defaultEnabled: true,
    buildRequestBody: (input) => {
      const url = trimText(input.url);
      if (!url) {
        return null;
      }

      return {
        url,
        mode: input.mode ?? 'fast',
        extract_links: input.extract_links === true,
        extract_images: input.extract_images === true,
        extract_meta: input.extract_meta === true,
      };
    },
  },
  {
    key: 'pageToMarkdown',
    runtimeName: 'page_to_markdown',
    labelKey: 'settings.modal.openadapterTools.pageToMarkdown.title',
    descriptionKey: 'settings.modal.openadapterTools.pageToMarkdown.description',
    runtimeDescription:
      'Convert a webpage to clean Markdown so the model can read the page content more reliably.',
    endpoint: '/v1/tools/scrape/markdown',
    parameters: PAGE_TO_MARKDOWN_PARAMETERS_JSON_SCHEMA as Record<string, unknown>,
    requiredField: 'url',
    defaultEnabled: true,
    buildRequestBody: (input) => {
      const url = trimText(input.url);
      if (!url) {
        return null;
      }

      return {
        url,
        mode: input.mode ?? 'fast',
      };
    },
  },
  {
    key: 'crawlSite',
    runtimeName: 'crawl_site',
    labelKey: 'settings.modal.openadapterTools.crawlSite.title',
    descriptionKey: 'settings.modal.openadapterTools.crawlSite.description',
    runtimeDescription:
      'Crawl multiple pages on a site with depth control and return collected page text and metadata.',
    endpoint: '/v1/tools/crawl',
    parameters: CRAWL_PARAMETERS_JSON_SCHEMA as Record<string, unknown>,
    requiredField: 'url',
    defaultEnabled: true,
    buildRequestBody: (input) => {
      const url = trimText(input.url);
      if (!url) {
        return null;
      }

      return {
        url,
        max_pages: clampNumber(input.max_pages, 5, 1, 20),
        max_depth: clampNumber(input.max_depth, 1, 0, 5),
        same_domain: input.same_domain !== false,
      };
    },
  },
] as const satisfies readonly OpenAdapterToolDefinition[];

export type OpenAdapterToolKey = (typeof OPENADAPTER_TOOL_DEFINITIONS)[number]['key'];

export const OPENADAPTER_TOOL_SETTING_KEYS = OPENADAPTER_TOOL_DEFINITIONS.map(
  (definition) => definition.key
) as OpenAdapterToolKey[];
