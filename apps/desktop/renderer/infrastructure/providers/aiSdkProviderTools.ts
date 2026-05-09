import { jsonSchema, tool, type Tool } from 'ai';
import type { McpToolInfo } from '@contracts/desktop';
import type { ChatAttachment, ChatMessage, TavilyConfig } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import { getMessageAttachments } from '@/shared/utils/chatMessageParts';
import { decideAdaptiveToolParallelism } from '@/infrastructure/providers/requestPolicy';
import type { RequestPolicy } from '@/infrastructure/providers/requestPolicy';
import { callTavilySearch, hasSearchConfig } from '@/infrastructure/providers/tavily';
import { TAVILY_SEARCH_PARAMETERS_JSON_SCHEMA } from '@/infrastructure/providers/toolSchemas';

type JsonSchemaDefinition = Parameters<typeof jsonSchema>[0];

type ToolSchedulerTask = {
  args: Record<string, unknown>;
  run: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

type TavilySearchInput = {
  query?: string;
  search_depth?: TavilyConfig['searchDepth'];
  max_results?: number;
  topic?: TavilyConfig['topic'];
};

type UploadedImageToolInput = {
  attachment_id?: string;
  image_name?: string;
  prompt?: string;
};

const buildJsonSchema = <Input>(schema: JsonSchemaDefinition) => jsonSchema<Input>(schema);

const defineRuntimeTool = <Input extends Record<string, unknown>, Output>(
  definition: Tool<Input, Output>
): Tool<Input, Output> => tool(definition);

const createToolScheduler = (requestPolicy?: RequestPolicy) => {
  const maxParallelism = Math.max(1, requestPolicy?.toolParallelism ?? 1);
  const queue: ToolSchedulerTask[] = [];
  let activeCount = 0;
  let drainQueued = false;

  const resolveLimit = (): number => {
    if (queue.length === 0) {
      return maxParallelism;
    }

    const adaptiveParallelism = decideAdaptiveToolParallelism(
      queue.map((task) => ({
        query: typeof task.args.query === 'string' ? task.args.query : undefined,
        search_depth:
          task.args.search_depth === 'basic' ||
          task.args.search_depth === 'advanced' ||
          task.args.search_depth === 'fast' ||
          task.args.search_depth === 'ultra-fast'
            ? task.args.search_depth
            : undefined,
        max_results: typeof task.args.max_results === 'number' ? task.args.max_results : undefined,
        topic:
          task.args.topic === 'general' || task.args.topic === 'news' ? task.args.topic : undefined,
      }))
    );

    return Math.max(1, Math.min(maxParallelism, adaptiveParallelism));
  };

  const drain = () => {
    drainQueued = false;

    while (queue.length > 0 && activeCount < resolveLimit()) {
      const nextTask = queue.shift();
      if (!nextTask) {
        return;
      }

      activeCount += 1;
      Promise.resolve()
        .then(nextTask.run)
        .then(nextTask.resolve, nextTask.reject)
        .finally(() => {
          activeCount -= 1;
          if (queue.length > 0 && !drainQueued) {
            drainQueued = true;
            queueMicrotask(drain);
          }
        });
    }
  };

  return {
    run<T>(args: Record<string, unknown>, worker: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        queue.push({
          args,
          run: worker,
          resolve: (value) => {
            resolve(value as T);
          },
          reject,
        });

        if (!drainQueued) {
          drainQueued = true;
          queueMicrotask(drain);
        }
      });
    },
  };
};

export const buildProviderOptionsRecord = (
  providerKeys: string[],
  options?: Record<string, unknown>
): Record<string, Record<string, unknown>> | undefined => {
  if (!options || Object.keys(options).length === 0) {
    return undefined;
  }

  const record: Record<string, Record<string, unknown>> = {};
  const normalizedKeys = Array.from(
    new Set(providerKeys.map((key) => key.split('.')[0]?.trim()).filter(Boolean))
  );

  for (const key of normalizedKeys) {
    record[key] = options;
  }

  return record;
};

const buildMcpToolSet = async (): Promise<Record<string, unknown>> => {
  const bridge = window.firechat?.mcp;
  if (!bridge) {
    return {};
  }

  const result = await bridge.listTools().catch((error) => {
    console.error('Failed to load MCP tools:', error);
    return { tools: [], errors: [] };
  });
  const tools: Record<string, unknown> = {};

  result.tools.forEach((mcpTool: McpToolInfo) => {
    tools[mcpTool.key] = defineRuntimeTool<Record<string, unknown>, unknown>({
      description:
        mcpTool.description || `Call MCP tool ${mcpTool.name} from server ${mcpTool.serverName}.`,
      inputSchema: buildJsonSchema<Record<string, unknown>>(
        mcpTool.inputSchema as JsonSchemaDefinition
      ),
      execute: async (input: Record<string, unknown> = {}) => {
        try {
          return await bridge.callTool({
            serverId: mcpTool.serverId,
            toolName: mcpTool.name,
            arguments: input,
          });
        } catch (error) {
          return {
            serverId: mcpTool.serverId,
            toolName: mcpTool.name,
            isError: true,
            content: [
              {
                type: 'text',
                text: error instanceof Error ? error.message : String(error),
              },
            ],
          };
        }
      },
    });
  });

  return tools;
};

const getImageAttachments = (messages?: ChatMessage[]): ChatAttachment[] => {
  return (messages ?? [])
    .flatMap((message) => getMessageAttachments(message))
    .filter((attachment) => attachment.kind === 'image' && Boolean(attachment.data));
};

const findImageAttachment = (
  attachments: ChatAttachment[],
  input: { attachment_id?: string; image_name?: string }
): ChatAttachment | undefined => {
  const attachmentId = typeof input.attachment_id === 'string' ? input.attachment_id.trim() : '';
  const imageName = typeof input.image_name === 'string' ? input.image_name.trim() : '';

  if (attachmentId) {
    return attachments.find((attachment) => attachment.id === attachmentId);
  }

  if (imageName) {
    return attachments.find((attachment) => attachment.name === imageName);
  }

  return attachments[attachments.length - 1];
};

const buildUploadedImageToolSet = (messages?: ChatMessage[]): Record<string, unknown> => {
  const attachments = getImageAttachments(messages);
  if (attachments.length === 0) {
    return {};
  }

  return {
    analyze_uploaded_image: defineRuntimeTool<UploadedImageToolInput, unknown>({
      description:
        'Analyze an uploaded image attachment through the built-in Luma Vision MCP server before answering visual questions. Use attachment_id from the attached-image block when available.',
      inputSchema: buildJsonSchema<UploadedImageToolInput>({
        type: 'object',
        properties: {
          attachment_id: {
            type: 'string',
            description: 'Uploaded image attachment id from the attached-image block.',
          },
          image_name: {
            type: 'string',
            description: 'Uploaded image file name. Used only when attachment_id is unavailable.',
          },
          prompt: {
            type: 'string',
            description: 'Question or instruction for image understanding.',
          },
        },
      }),
      execute: async (input: UploadedImageToolInput = {}) => {
        const bridge = window.firechat?.mcp;
        if (!bridge) {
          return { error: 'MCP bridge is unavailable.' };
        }

        const attachment = findImageAttachment(attachments, input);
        if (!attachment?.data) {
          return { error: 'Uploaded image attachment was not found.' };
        }

        return bridge.callTool({
          serverId: 'luma',
          toolName: 'image_understand',
          arguments: {
            image_source: `data:${attachment.mimeType};base64,${attachment.data}`,
            prompt: input.prompt?.trim() || 'Describe this image and extract visible text.',
          },
        });
      },
    }),
  };
};

export const buildToolSet = async ({
  requestPolicy,
  tavilyConfig,
  searchEnabled,
  hostedSearchTool,
  hostedToolSearchTool,
  deferredToolProvider,
  messages,
}: {
  requestPolicy?: RequestPolicy;
  tavilyConfig?: TavilyConfig;
  searchEnabled: boolean;
  hostedSearchTool?: unknown;
  hostedToolSearchTool?: unknown;
  deferredToolProvider?: string;
  messages?: ChatMessage[];
}): Promise<Record<string, unknown> | undefined> => {
  const scheduler = createToolScheduler(requestPolicy);
  const tools: Record<string, unknown> = {};
  const deferredProviderOptions =
    hostedToolSearchTool && deferredToolProvider
      ? {
          [deferredToolProvider]: {
            deferLoading: true,
          },
        }
      : undefined;

  if (hostedSearchTool) {
    tools.web_search = hostedSearchTool;
  } else if (searchEnabled && hasSearchConfig(tavilyConfig)) {
    tools.tavily_search = defineRuntimeTool<TavilySearchInput, unknown>({
      description:
        'Search the web for up-to-date information and return relevant results with sources.',
      inputSchema: buildJsonSchema<TavilySearchInput>(
        TAVILY_SEARCH_PARAMETERS_JSON_SCHEMA as unknown as JsonSchemaDefinition
      ),
      providerOptions: deferredProviderOptions,
      execute: async (input: TavilySearchInput = {}, options?: { abortSignal?: AbortSignal }) =>
        scheduler.run(input, async () => {
          if (!input.query) {
            return { error: t('settings.provider.error.tool.missingQuery') };
          }

          if (options?.abortSignal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
          }

          try {
            return await callTavilySearch(tavilyConfig, {
              query: input.query,
              search_depth: input.search_depth,
              max_results: input.max_results,
              topic: input.topic,
            });
          } catch (error) {
            return {
              error:
                error instanceof Error ? error.message : t('settings.search.error.requestFailed'),
            };
          }
        }),
    });
  }

  if (hostedToolSearchTool && Object.keys(tools).length > 0) {
    tools.toolSearch = hostedToolSearchTool;
  }

  Object.assign(tools, await buildMcpToolSet());
  Object.assign(tools, buildUploadedImageToolSet(messages));

  return Object.keys(tools).length > 0 ? tools : undefined;
};
