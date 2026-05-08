import type { McpConfig, McpServerConfig } from '@contracts/desktop';

export type McpServerForm = McpServerConfig & {
  argsText: string;
  envText: string;
  headersText: string;
};

const DEFAULT_TIMEOUT_MS = 60000;

export const createEmptyMcpServerForm = (): McpServerForm => ({
  id: '',
  name: '',
  transport: 'http',
  url: '',
  command: '',
  args: [],
  env: {},
  argsText: '[]',
  envText: '{}',
  enabled: true,
  timeoutMs: DEFAULT_TIMEOUT_MS,
  bearerToken: '',
  headers: {},
  headersText: '{}',
});

export const toMcpServerForm = (server: McpServerConfig): McpServerForm => ({
  ...server,
  transport: server.transport ?? 'http',
  url: server.url ?? '',
  command: server.command ?? '',
  args: server.args ?? [],
  env: server.env ?? {},
  argsText: JSON.stringify(server.args ?? [], null, 2),
  envText: JSON.stringify(server.env ?? {}, null, 2),
  bearerToken: server.bearerToken ?? '',
  headers: server.headers ?? {},
  headersText: JSON.stringify(server.headers ?? {}, null, 2),
});

const parseHeaders = (value: string, serverName: string): Record<string, string> => {
  const parsed = JSON.parse(value || '{}') as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${serverName} 的 headers 必须是 JSON 对象`);
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([key, headerValue]) => [key, String(headerValue)])
  );
};

const normalizeServerId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const isAllowedMcpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))
    );
  } catch {
    return false;
  }
};

export const validateMcpServers = (servers: McpServerForm[]): void => {
  const ids = new Set<string>();

  servers.forEach((server, index) => {
    const label = server.name || server.id || `MCP ${index + 1}`;
    const id = normalizeServerId(server.id);
    if (!id) {
      throw new Error(`${label} 缺少 ID`);
    }

    if (ids.has(id)) {
      throw new Error(`${label} 的 ID 重复`);
    }

    ids.add(id);

    if (server.transport === 'http' && !(server.url ?? '').trim()) {
      throw new Error(`${label} 缺少 URL`);
    }

    if (server.transport === 'http' && !isAllowedMcpUrl((server.url ?? '').trim())) {
      throw new Error(`${label} 的 URL 只支持 https、localhost 或 127.0.0.1`);
    }

    if (server.transport === 'stdio' && !server.command?.trim()) {
      throw new Error(`${label} 缺少本地命令`);
    }

    if (
      !Number.isInteger(server.timeoutMs) ||
      server.timeoutMs < 5000 ||
      server.timeoutMs > 300000
    ) {
      throw new Error(`${label} 的超时毫秒必须在 5000-300000 之间`);
    }
  });
};

const parseArgs = (value: string, serverName: string): string[] => {
  const parsed = JSON.parse(value || '[]') as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`${serverName} 的 args 必须是 JSON 数组`);
  }

  return parsed.map((item) => String(item).trim()).filter(Boolean);
};

export const toMcpConfig = (enabled: boolean, servers: McpServerForm[]): McpConfig => ({
  enabled,
  servers: servers.map((server, index) => ({
    id: server.id,
    name: server.name,
    transport: server.transport,
    url: server.transport === 'http' ? server.url : '',
    command: server.transport === 'stdio' ? server.command : '',
    args:
      server.transport === 'stdio'
        ? parseArgs(server.argsText, server.name || server.id || `MCP ${index + 1}`)
        : [],
    env:
      server.transport === 'stdio'
        ? parseHeaders(server.envText, server.name || server.id || `MCP ${index + 1}`)
        : {},
    enabled: server.enabled,
    timeoutMs: server.timeoutMs,
    bearerToken: server.bearerToken,
    headers: parseHeaders(server.headersText, server.name || server.id || `MCP ${index + 1}`),
  })),
});
