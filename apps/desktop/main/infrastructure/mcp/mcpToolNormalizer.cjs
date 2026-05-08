const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeToolKeyPart = (value) =>
  normalizeText(value)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

const buildMcpToolKey = (serverId, toolName) => {
  const serverPart = normalizeToolKeyPart(serverId) || 'server';
  const toolPart = normalizeToolKeyPart(toolName) || 'tool';
  return `mcp_${serverPart}_${toolPart}`;
};

const normalizeToolListItem = (server, tool) => ({
  key: buildMcpToolKey(server.id, tool.name),
  serverId: server.id,
  serverName: server.name,
  name: tool.name,
  title: normalizeText(tool.title),
  description: normalizeText(tool.description),
  inputSchema: tool.inputSchema ?? {
    type: 'object',
    properties: {},
  },
});

const normalizeCallToolContent = (content) => {
  if (!Array.isArray(content)) {
    return [];
  }

  return content.map((item) => {
    if (!item || typeof item !== 'object') {
      return { type: 'text', text: String(item ?? '') };
    }

    return item;
  });
};

const normalizeCallToolResult = ({ serverId, toolName, result }) => ({
  serverId,
  toolName,
  isError: Boolean(result?.isError),
  content: normalizeCallToolContent(result?.content),
  structuredContent: result?.structuredContent,
});

module.exports = {
  normalizeCallToolResult,
  normalizeToolListItem,
};
