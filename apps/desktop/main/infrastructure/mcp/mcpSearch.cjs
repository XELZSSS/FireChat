/* global process */

const SEARCH_MCP_TIMEOUT_MS = 60000;
const SEARCH_MCP_TOOLS = {
  exa: 'web_search_exa',
  tavily: 'tavily_search',
  firecrawl: 'firecrawl_search',
  searxng: 'searxng_web_search',
};

const clampSearchResultCount = (value) => {
  const numeric = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(numeric)) {
    return 5;
  }

  return Math.min(Math.max(Math.trunc(numeric), 1), 20);
};

const normalizeOptionalText = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeSearchPayload = (payload) => {
  const record = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const engine = SEARCH_MCP_TOOLS[record.engine] ? record.engine : 'exa';
  const query = typeof record.query === 'string' ? record.query.trim() : '';
  return {
    engine,
    query,
    maxResults: clampSearchResultCount(record.maxResults),
    apiKey: normalizeOptionalText(record.apiKey),
    searchDepth:
      record.searchDepth === 'advanced' ||
      record.searchDepth === 'fast' ||
      record.searchDepth === 'ultra-fast'
        ? record.searchDepth
        : 'basic',
    topic: record.topic === 'news' ? record.topic : 'general',
    searxngBaseUrl: normalizeOptionalText(record.searxngBaseUrl),
    searxngLanguage: normalizeOptionalText(record.searxngLanguage) || 'all',
    searxngTimeRange:
      record.searxngTimeRange === 'day' ||
      record.searxngTimeRange === 'month' ||
      record.searxngTimeRange === 'year'
        ? record.searxngTimeRange
        : undefined,
    searxngSafeSearch:
      record.searxngSafeSearch === 0 || record.searxngSafeSearch === 2
        ? record.searxngSafeSearch
        : 1,
    firecrawlLocation: normalizeOptionalText(record.firecrawlLocation),
    firecrawlCountry: normalizeOptionalText(record.firecrawlCountry).toUpperCase(),
    firecrawlScrapeContent: record.firecrawlScrapeContent === true,
  };
};

const ensureSearchConfig = (search) => {
  if (!search.query) {
    throw new Error('Missing search query');
  }
  if ((search.engine === 'tavily' || search.engine === 'firecrawl') && !search.apiKey) {
    throw new Error(`${search.engine} MCP requires an API key`);
  }
  if (search.engine === 'searxng' && !search.searxngBaseUrl) {
    throw new Error('SearXNG MCP requires a SearXNG URL');
  }
};

const buildSearchServer = (search) => {
  if (search.engine === 'tavily') {
    return {
      id: '__firechat_tavily_mcp',
      name: 'Tavily',
      transport: 'http',
      url: `https://mcp.tavily.com/mcp/?tavilyApiKey=${encodeURIComponent(search.apiKey)}`,
      timeoutMs: SEARCH_MCP_TIMEOUT_MS,
      headers: {},
    };
  }

  if (search.engine === 'firecrawl') {
    return {
      id: '__firechat_firecrawl_mcp',
      name: 'Firecrawl',
      transport: 'http',
      url: 'https://mcp.firecrawl.dev/v2/mcp',
      timeoutMs: SEARCH_MCP_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${search.apiKey}`,
      },
    };
  }

  if (search.engine === 'searxng') {
    return {
      id: '__firechat_searxng_mcp',
      name: 'SearXNG',
      transport: 'stdio',
      command: process.execPath,
      args: [require.resolve('mcp-searxng')],
      env: {
        ELECTRON_RUN_AS_NODE: '1',
        SEARXNG_URL: search.searxngBaseUrl,
      },
      timeoutMs: SEARCH_MCP_TIMEOUT_MS,
      headers: {},
    };
  }

  return {
    id: '__firechat_exa_mcp',
    name: 'Exa',
    transport: 'http',
    url: 'https://mcp.exa.ai/mcp',
    timeoutMs: SEARCH_MCP_TIMEOUT_MS,
    headers: search.apiKey ? { 'x-api-key': search.apiKey } : {},
  };
};

const buildSearchArguments = (search) => {
  if (search.engine === 'tavily') {
    return {
      query: search.query,
      max_results: search.maxResults,
      search_depth: search.searchDepth,
    };
  }

  if (search.engine === 'firecrawl') {
    const scrapeOptions =
      search.firecrawlScrapeContent || search.firecrawlCountry
        ? {
            ...(search.firecrawlScrapeContent ? { formats: ['summary'] } : {}),
            ...(search.firecrawlCountry ? { location: { country: search.firecrawlCountry } } : {}),
          }
        : undefined;

    return {
      query: search.query,
      limit: search.maxResults,
      sources: [{ type: search.topic === 'news' ? 'news' : 'web' }],
      location: search.firecrawlLocation || undefined,
      scrapeOptions,
    };
  }

  if (search.engine === 'searxng') {
    return {
      query: search.query,
      pageno: 1,
      language: search.searxngLanguage,
      safesearch: search.searxngSafeSearch,
      time_range: search.searxngTimeRange,
    };
  }

  return {
    query: search.query,
    numResults: search.maxResults,
  };
};

const createSearchMcpToolCaller =
  ({ ensureClient, normalizeCallToolResult }) =>
  async (payload) => {
    const search = normalizeSearchPayload(payload);
    ensureSearchConfig(search);
    const server = buildSearchServer(search);
    const toolName = SEARCH_MCP_TOOLS[search.engine];
    const client = await ensureClient(server);
    const result = await client.callTool(
      {
        name: toolName,
        arguments: buildSearchArguments(search),
      },
      undefined,
      { timeout: server.timeoutMs }
    );

    return normalizeCallToolResult({
      serverId: server.id,
      toolName,
      result,
    });
  };

module.exports = {
  createSearchMcpToolCaller,
};
