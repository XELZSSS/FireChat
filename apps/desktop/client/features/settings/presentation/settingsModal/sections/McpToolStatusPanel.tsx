import type { McpToolListResult } from '@contracts/desktop';

type McpToolStatusPanelProps = {
  toolResult: McpToolListResult;
};

export const McpToolStatusPanel = ({ toolResult }: McpToolStatusPanelProps) => (
  <div className="space-y-3 border border-[var(--line-1)] bg-[var(--bg-2)]/40 p-4">
    <div className="text-sm font-medium text-[var(--ink-1)]">工具状态</div>
    {toolResult.tools.length > 0 ? (
      <div className="grid gap-2 md:grid-cols-2">
        {toolResult.tools.map((item) => (
          <div
            key={item.key}
            className="border border-[var(--line-1)] px-3 py-2 text-xs"
          >
            <div className="font-medium text-[var(--ink-1)]">{item.name}</div>
            <div className="text-[var(--ink-3)]">{item.serverName}</div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-xs text-[var(--ink-3)]">没有可用工具。</div>
    )}
    {toolResult.errors.length > 0 ? (
      <div className="space-y-1">
        {toolResult.errors.map((error) => (
          <div
            key={`${error.serverId}-${error.message}`}
            className="text-xs leading-5 text-[var(--status-error)]"
          >
            {error.serverId}: {error.message}
          </div>
        ))}
      </div>
    ) : null}
  </div>
);
