/* global process */
const { app } = require('electron');
const { normalizeMcpConfigPayload, readMcpConfig } = require('./mcpConfig.cjs');
const { createSearchMcpToolCaller } = require('./mcpSearch.cjs');
const { normalizeCallToolResult, normalizeToolListItem } = require('./mcpToolNormalizer.cjs');

const clients = new Map();

const createSignature = (server) =>
  JSON.stringify({
    transport: server.transport,
    url: server.url,
    command: server.command,
    args: server.args,
    env: server.env,
    bearerToken: server.bearerToken,
    headers: server.headers,
    timeoutMs: server.timeoutMs,
  });

const buildRequestHeaders = (server) => {
  const headers = { ...(server.headers ?? {}) };
  if (server.bearerToken) {
    headers.Authorization = `Bearer ${server.bearerToken}`;
  }
  return headers;
};

const closeEntry = async (entry) => {
  try {
    await entry.transport?.terminateSession?.();
  } catch {
    // Server may not support explicit session termination.
  }

  try {
    await entry.client?.close?.();
  } catch {
    // Ignore close errors.
  }

  try {
    await entry.transport?.close?.();
  } catch {
    // Ignore close errors.
  }
};

const loadSdk = async () => {
  const [{ Client }, { StreamableHTTPClientTransport }, { StdioClientTransport }] =
    await Promise.all([
      import('@modelcontextprotocol/sdk/client/index.js'),
      import('@modelcontextprotocol/sdk/client/streamableHttp.js'),
      import('@modelcontextprotocol/sdk/client/stdio.js'),
    ]);

  return { Client, StdioClientTransport, StreamableHTTPClientTransport };
};

const getEnabledServers = () => {
  const config = readMcpConfig();
  return config.enabled ? config.servers.filter((server) => server.enabled) : [];
};

const createClientEntry = async (server) => {
  const { Client, StdioClientTransport, StreamableHTTPClientTransport } = await loadSdk();
  const client = new Client({
    name: 'firechat',
    version: app.getVersion(),
  });
  const transport =
    server.transport === 'stdio'
      ? new StdioClientTransport({
          command: server.command,
          args: server.args ?? [],
          env: {
            ...process.env,
            ...(server.env ?? {}),
          },
        })
      : new StreamableHTTPClientTransport(new URL(server.url), {
          requestInit: {
            headers: buildRequestHeaders(server),
          },
        });

  await client.connect(transport, { timeout: server.timeoutMs });
  return {
    client,
    transport,
    signature: createSignature(server),
  };
};

const ensureClient = async (server) => {
  const signature = createSignature(server);
  const cached = clients.get(server.id);
  if (cached?.signature === signature) {
    return cached.client;
  }

  if (cached) {
    await closeEntry(cached);
    clients.delete(server.id);
  }

  const entry = await createClientEntry(server);
  clients.set(server.id, {
    ...entry,
    signature,
  });

  return entry.client;
};

const collectToolsFromServers = async (servers, { useCache }) => {
  const tools = [];
  const errors = [];
  const usedToolKeys = new Set();

  for (const server of servers) {
    let entry = null;
    try {
      const client = useCache
        ? await ensureClient(server)
        : (entry = await createClientEntry(server)).client;
      const result = await client.listTools({}, { timeout: server.timeoutMs });
      result.tools.forEach((tool) => {
        const normalizedTool = normalizeToolListItem(server, tool);
        let key = normalizedTool.key;
        let suffix = 2;
        while (usedToolKeys.has(key)) {
          key = `${normalizedTool.key}_${suffix}`;
          suffix += 1;
        }

        usedToolKeys.add(key);
        tools.push({
          ...normalizedTool,
          key,
        });
      });
    } catch (error) {
      errors.push({
        serverId: server.id,
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      if (entry) {
        await closeEntry(entry);
      }
    }
  }

  return { tools, errors };
};

const listMcpTools = async () => collectToolsFromServers(getEnabledServers(), { useCache: true });

const testMcpConfig = async (payload) => {
  const config = normalizeMcpConfigPayload(payload);
  const servers = config.enabled ? config.servers.filter((server) => server.enabled) : [];
  return collectToolsFromServers(servers, { useCache: false });
};

const callMcpTool = async ({ serverId, toolName, arguments: toolArguments }) => {
  const server = getEnabledServers().find((item) => item.id === serverId);
  if (!server) {
    throw new Error(`MCP server is not enabled: ${serverId}`);
  }

  const client = await ensureClient(server);
  const result = await client.callTool(
    {
      name: toolName,
      arguments: toolArguments && typeof toolArguments === 'object' ? toolArguments : {},
    },
    undefined,
    { timeout: server.timeoutMs }
  );

  return normalizeCallToolResult({
    serverId,
    toolName,
    result,
  });
};

const callSearchMcpTool = createSearchMcpToolCaller({
  ensureClient,
  normalizeCallToolResult,
});

const reloadMcpClients = async () => {
  const entries = Array.from(clients.values());
  clients.clear();
  await Promise.all(entries.map(closeEntry));
  return listMcpTools();
};

const getMcpServers = () => {
  const config = readMcpConfig();
  return {
    enabled: config.enabled,
    servers: config.servers.map((server) => ({
      id: server.id,
      name: server.name,
      transport: server.transport,
      url: server.url,
      command: server.command,
      args: server.args,
      env: server.env,
      enabled: server.enabled,
      timeoutMs: server.timeoutMs,
      connected: clients.has(server.id),
    })),
  };
};

const stopMcpClients = async () => {
  const entries = Array.from(clients.values());
  clients.clear();
  await Promise.all(entries.map(closeEntry));
};

module.exports = {
  callMcpTool,
  callSearchMcpTool,
  getMcpServers,
  listMcpTools,
  reloadMcpClients,
  stopMcpClients,
  testMcpConfig,
};
