const { invoke } = require('./ipc.cjs');

const createMcpBridge = ({ ipcRenderer, channels }) => ({
  getConfig: invoke(ipcRenderer, channels.mcp.getConfig),
  saveConfig: invoke(ipcRenderer, channels.mcp.saveConfig),
  reload: invoke(ipcRenderer, channels.mcp.reload),
  getServers: invoke(ipcRenderer, channels.mcp.getServers),
  listTools: invoke(ipcRenderer, channels.mcp.listTools),
  testConfig: invoke(ipcRenderer, channels.mcp.testConfig),
  callTool: invoke(ipcRenderer, channels.mcp.callTool),
  callSearch: invoke(ipcRenderer, channels.mcp.callSearch),
});

module.exports = {
  createMcpBridge,
};
