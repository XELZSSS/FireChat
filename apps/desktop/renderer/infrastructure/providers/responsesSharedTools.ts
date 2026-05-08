import { TavilyConfig } from '@/shared/types/chat';
import { callTavilySearch, hasSearchConfig } from '@/infrastructure/providers/tavily';
import { TAVILY_SEARCH_PARAMETERS_JSON_SCHEMA } from '@/infrastructure/providers/toolSchemas';
import type {
  ResponseFunctionCallItem,
  ResponseFunctionTool,
  ResponseToolExecutionOptions,
  ResponseTavilyToolOptions,
  ResponseToolCallArgs,
  ResponseToolDefinition,
  ResponseToolExecutionMessages,
} from '@/infrastructure/providers/responsesSharedTypes';

const tavilySearchTool = (deferLoading = false): ResponseFunctionTool => ({
  type: 'function',
  name: 'tavily_search',
  description:
    'Search the web for up-to-date information and return relevant results with sources.',
  defer_loading: deferLoading ? true : undefined,
  strict: true,
  parameters: TAVILY_SEARCH_PARAMETERS_JSON_SCHEMA,
});

export const createResponseTools = ({
  useHostedToolSearch = false,
  includeSearchTool = true,
}: {
  useHostedToolSearch?: boolean;
  includeSearchTool?: boolean;
} = {}): ResponseToolDefinition[] => {
  const tools: ResponseToolDefinition[] = [];

  if (!includeSearchTool) {
    return tools;
  }

  if (!useHostedToolSearch) {
    tools.push(tavilySearchTool(false));
    return tools;
  }

  tools.push(
    {
      type: 'namespace',
      name: 'search',
      description: 'Search and retrieval tools for finding current public information on the web.',
      tools: [tavilySearchTool(true)],
    },
    { type: 'tool_search' }
  );

  return tools;
};

export const buildResponseTavilyTools = ({
  tavilyConfig,
  useHostedToolSearch = false,
}: ResponseTavilyToolOptions): ResponseToolDefinition[] | undefined => {
  const tools = createResponseTools({
    useHostedToolSearch,
    includeSearchTool: hasSearchConfig(tavilyConfig),
  });

  return tools.length > 0 ? tools : undefined;
};

export const parseResponseToolCallArgs = (call: ResponseFunctionCallItem): ResponseToolCallArgs => {
  try {
    return call.arguments ? (JSON.parse(call.arguments) as ResponseToolCallArgs) : {};
  } catch {
    return {};
  }
};

export const runResponseTavilyToolCall = async (
  call: ResponseFunctionCallItem,
  tavilyConfig: TavilyConfig | undefined,
  messages: ResponseToolExecutionMessages,
  options: ResponseToolExecutionOptions
): Promise<string> => {
  if (call.name !== 'tavily_search') {
    return JSON.stringify({
      error: messages.unsupportedTool(call.name),
    });
  }

  const args = parseResponseToolCallArgs(call);
  if (!args.query) {
    return JSON.stringify({ error: messages.missingQuery });
  }
  if (!options.searchEnabled) {
    return JSON.stringify({ error: messages.unsupportedTool(call.name) });
  }

  try {
    const result = await callTavilySearch(tavilyConfig, {
      query: args.query,
      search_depth: args.search_depth,
      max_results: args.max_results,
      topic: args.topic,
    });
    return JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({
      error:
        error instanceof Error
          ? error.message
          : (messages.requestFailed ?? 'Search request failed'),
    });
  }
};
