import { Button, Toggle } from '@/shared/ui';
import { McpServerCard } from '@client/features/settings/presentation/settingsModal/sections/McpServerCard';
import { McpToolStatusPanel } from '@client/features/settings/presentation/settingsModal/sections/McpToolStatusPanel';
import { useMcpTabController } from '@client/features/settings/presentation/settingsModal/services/useMcpTabController';

const MCP_ACTION_BUTTON_CLASS_NAME = 'w-28';

const McpTab = () => {
  const {
    addServer,
    canUseMcp,
    enabled,
    expandedServerIndex,
    isBusy,
    patchServer,
    removeServer,
    saveConfig,
    servers,
    setEnabled,
    statusText,
    testConfig,
    testCurrentConfig,
    toolResult,
    toggleExpandedServer,
  } = useMcpTabController();

  return (
    <div className="space-y-4">
      <div className="border border-[var(--line-1)] bg-[var(--bg-2)]/40 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-[var(--ink-1)]">MCP</div>
          </div>
          <Toggle checked={enabled} onCheckedChange={setEnabled} disabled={!canUseMcp || isBusy} />
        </div>
      </div>

      <div className="max-h-[min(28rem,calc(100vh-20rem))] space-y-2 overflow-y-auto pr-1">
        {servers.map((server, index) => (
          <McpServerCard
            key={`${server.id}-${index}`}
            canUseMcp={canUseMcp}
            index={index}
            isExpanded={expandedServerIndex === index}
            isBusy={isBusy}
            onPatch={patchServer}
            onRemove={removeServer}
            onToggleExpanded={toggleExpandedServer}
            server={server}
          />
        ))}
      </div>

      {servers.length === 0 ? (
        <div className="border border-dashed border-[var(--line-1)] px-4 py-6 text-center text-xs text-[var(--ink-3)]">
          还没有 MCP 配置。
        </div>
      ) : null}

      {statusText ? (
        <div className="text-xs leading-5 text-[var(--ink-2)]">{statusText}</div>
      ) : null}

      {toolResult ? <McpToolStatusPanel toolResult={toolResult} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="subtle"
          size="sm"
          className={MCP_ACTION_BUTTON_CLASS_NAME}
          onClick={addServer}
          disabled={isBusy}
        >
          添加 MCP
        </Button>
        <Button
          variant="primary"
          size="sm"
          className={MCP_ACTION_BUTTON_CLASS_NAME}
          onClick={saveConfig}
          disabled={!canUseMcp || isBusy}
        >
          保存并重载
        </Button>
        <Button
          variant="subtle"
          size="sm"
          className={MCP_ACTION_BUTTON_CLASS_NAME}
          onClick={testCurrentConfig}
          disabled={!canUseMcp || isBusy}
        >
          测试当前配置
        </Button>
        <Button variant="ghost" size="sm" onClick={testConfig} disabled={!canUseMcp || isBusy}>
          测试已保存配置
        </Button>
      </div>
    </div>
  );
};

export default McpTab;

