const { FIRECHAT_AUTH_CONFIG_NAME } = require('../config/providerConfig.cjs');
const { readConfigFile, updateConfigFile } = require('../config/localConfig.cjs');

const DEFAULT_MCP_TIMEOUT_MS = 60000;
const MIN_MCP_TIMEOUT_MS = 5000;
const MAX_MCP_TIMEOUT_MS = 300000;
const createBuiltInMcpServers = () => [
  {
    id: 'context7',
    name: 'Context7',
    transport: 'http',
    url: 'https://mcp.context7.com/mcp',
    enabled: false,
    timeoutMs: DEFAULT_MCP_TIMEOUT_MS,
  },
  {
    id: 'deepwiki',
    name: 'DeepWiki',
    transport: 'http',
    url: 'https://mcp.deepwiki.com/mcp',
    enabled: false,
    timeoutMs: DEFAULT_MCP_TIMEOUT_MS,
  },
  {
    id: 'luma',
    name: 'Luma Vision',
    transport: 'stdio',
    command: process.execPath,
    args: [require.resolve('luma-mcp')],
    env: {
      ELECTRON_RUN_AS_NODE: '1',
      MODEL_PROVIDER: 'siliconflow',
      SILICONFLOW_API_KEY: '',
    },
    enabled: false,
    timeoutMs: DEFAULT_MCP_TIMEOUT_MS,
  },
];

const toRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeHeaders = (value) =>
  Object.fromEntries(
    Object.entries(toRecord(value))
      .map(([key, headerValue]) => [normalizeText(key), normalizeText(headerValue)])
      .filter(([key, headerValue]) => key && headerValue)
  );

const normalizeEnv = (value) =>
  Object.fromEntries(
    Object.entries(toRecord(value))
      .map(([key, envValue]) => [normalizeText(key), String(envValue ?? '')])
      .filter(([key]) => key)
  );

const normalizeStringArray = (value) =>
  Array.isArray(value) ? value.map((item) => normalizeText(item)).filter(Boolean) : [];

const normalizeTimeoutMs = (value) => {
  const numeric = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_MCP_TIMEOUT_MS;
  }

  return Math.min(Math.max(Math.trunc(numeric), MIN_MCP_TIMEOUT_MS), MAX_MCP_TIMEOUT_MS);
};

const normalizeServerId = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const isAllowedMcpUrl = (value) => {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') {
      return true;
    }

    return url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname);
  } catch {
    return false;
  }
};

const mergeBuiltInMcpServers = (servers) => {
  const usedIds = new Set(
    servers.map((server) => normalizeServerId(toRecord(server).id)).filter(Boolean)
  );
  const missingBuiltInServers = createBuiltInMcpServers().filter(
    (server) => !usedIds.has(server.id)
  );
  return [...missingBuiltInServers, ...servers];
};

const normalizeMcpLocalConfig = (value) => {
  const record = toRecord(value);
  const servers = mergeBuiltInMcpServers(Array.isArray(record.servers) ? record.servers : []);
  const usedIds = new Set();

  return {
    enabled: typeof record.enabled === 'boolean' ? record.enabled : false,
    servers: servers.flatMap((item) => {
      const server = toRecord(item);
      const id = normalizeServerId(server.id);
      const transport = server.transport === 'stdio' ? 'stdio' : 'http';
      const url = normalizeText(server.url);
      const command = normalizeText(server.command);
      if (!id || usedIds.has(id)) {
        return [];
      }

      if (transport === 'http' && (!url || !isAllowedMcpUrl(url))) {
        return [];
      }

      if (transport === 'stdio' && !command) {
        return [];
      }

      usedIds.add(id);
      return [
        {
          id,
          name: normalizeText(server.name) || id,
          transport,
          url: transport === 'http' ? url : '',
          command: transport === 'stdio' ? command : '',
          args: transport === 'stdio' ? normalizeStringArray(server.args) : [],
          env: transport === 'stdio' ? normalizeEnv(server.env) : {},
          enabled: typeof server.enabled === 'boolean' ? server.enabled : true,
          timeoutMs: normalizeTimeoutMs(server.timeoutMs),
        },
      ];
    }),
  };
};

const normalizeMcpAuthConfig = (value) => {
  const servers = toRecord(toRecord(value).servers);

  return {
    servers: Object.fromEntries(
      Object.entries(servers).flatMap(([serverId, item]) => {
        const id = normalizeServerId(serverId);
        if (!id) {
          return [];
        }

        const server = toRecord(item);
        return [
          [
            id,
            {
              bearerToken: normalizeText(server.bearerToken),
              headers: normalizeHeaders(server.headers),
            },
          ],
        ];
      })
    ),
  };
};

const readMcpLocalConfig = () => normalizeMcpLocalConfig(toRecord(readConfigFile()).mcp);

const readMcpAuthConfig = () =>
  normalizeMcpAuthConfig(toRecord(readConfigFile(FIRECHAT_AUTH_CONFIG_NAME)).mcp);

const readMcpConfig = () => {
  const local = readMcpLocalConfig();
  const auth = readMcpAuthConfig();

  return {
    ...local,
    servers: local.servers.map((server) => ({
      ...server,
      bearerToken: auth.servers[server.id]?.bearerToken ?? '',
      headers: auth.servers[server.id]?.headers ?? {},
    })),
  };
};

const normalizeMcpConfigPayload = (value) => {
  const local = normalizeMcpLocalConfig(value);
  const auth = normalizeMcpAuthConfig({
    servers: Object.fromEntries(
      (Array.isArray(toRecord(value).servers) ? toRecord(value).servers : []).map((server) => [
        toRecord(server).id,
        {
          bearerToken: toRecord(server).bearerToken,
          headers: toRecord(server).headers,
        },
      ])
    ),
  });

  return {
    ...local,
    servers: local.servers.map((server) => ({
      ...server,
      bearerToken: auth.servers[server.id]?.bearerToken ?? '',
      headers: auth.servers[server.id]?.headers ?? {},
    })),
  };
};

const writeMcpConfig = (value) => {
  const normalized = normalizeMcpConfigPayload(value);
  const config = normalizeMcpLocalConfig(normalized);
  const auth = normalizeMcpAuthConfig(normalized);

  updateConfigFile(undefined, (current) => ({
    ...current,
    mcp: config,
  }));

  updateConfigFile(FIRECHAT_AUTH_CONFIG_NAME, (current) => ({
    ...current,
    mcp: auth,
  }));

  return readMcpConfig();
};

module.exports = {
  normalizeMcpConfigPayload,
  readMcpConfig,
  writeMcpConfig,
};
