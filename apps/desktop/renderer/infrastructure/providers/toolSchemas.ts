export const TAVILY_SEARCH_PARAMETERS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    query: { type: 'string', description: 'Search query' },
    search_depth: {
      type: 'string',
      enum: ['basic', 'advanced', 'fast', 'ultra-fast'],
      description: 'Search depth',
    },
    max_results: {
      type: 'integer',
      minimum: 1,
      maximum: 20,
      description: 'Number of results to return',
    },
    topic: {
      type: 'string',
      enum: ['general', 'news'],
      description: 'Search topic',
    },
  },
  required: ['query'],
} as const;
