const { IPC_CHANNELS } = require('../channels.cjs');
const { toRecord } = require('../systemHandlerHelpers.cjs');
const { readMcpConfig, writeMcpConfig } = require('../../../infrastructure/mcp/mcpConfig.cjs');
const {
  callMcpTool,
  callSearchMcpTool,
  getMcpServers,
  listMcpTools,
  reloadMcpClients,
  testMcpConfig,
} = require('../../../infrastructure/mcp/mcpClientManager.cjs');

const buildMcpHandlers = () => ({
  [IPC_CHANNELS.mcp.getConfig]: async () => readMcpConfig(),
  [IPC_CHANNELS.mcp.saveConfig]: async (_event, payload) => {
    const config = writeMcpConfig(toRecord(payload));
    await reloadMcpClients();
    return config;
  },
  [IPC_CHANNELS.mcp.reload]: async () => reloadMcpClients(),
  [IPC_CHANNELS.mcp.getServers]: async () => getMcpServers(),
  [IPC_CHANNELS.mcp.listTools]: async () => listMcpTools(),
  [IPC_CHANNELS.mcp.testConfig]: async (_event, payload) => testMcpConfig(toRecord(payload)),
  [IPC_CHANNELS.mcp.callTool]: async (_event, payload) => callMcpTool(toRecord(payload)),
  [IPC_CHANNELS.mcp.callSearch]: async (_event, payload) => callSearchMcpTool(toRecord(payload)),
});

module.exports = {
  buildMcpHandlers,
};
