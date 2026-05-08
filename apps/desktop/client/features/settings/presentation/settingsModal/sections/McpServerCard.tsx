import { Button, Field, Input, Toggle } from '@/shared/ui';
import { getSegmentButtonClassName } from '@client/features/settings/presentation/settingsModal/optionsTab/constants';
import {
  fullInputClass,
  textareaClass,
} from '@client/features/settings/presentation/settingsModal/sections/styles';
import type { McpServerForm } from '@client/features/settings/presentation/settingsModal/sections/mcpTabConfig';

type McpServerCardProps = {
  canUseMcp: boolean;
  index: number;
  isBusy: boolean;
  isExpanded: boolean;
  onPatch: (index: number, updates: Partial<McpServerForm>) => void;
  onRemove: (index: number) => void;
  onToggleExpanded: (index: number) => void;
  server: McpServerForm;
};

export const McpServerCard = ({
  canUseMcp,
  index,
  isBusy,
  isExpanded,
  onPatch,
  onRemove,
  onToggleExpanded,
  server,
}: McpServerCardProps) => {
  const endpoint = server.transport === 'stdio' ? server.command : server.url;

  return (
    <div className="border border-[var(--line-1)] bg-[var(--bg-2)]/40">
      <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-2">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onToggleExpanded(index)}
          disabled={isBusy}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs text-[var(--ink-3)]">MCP {index + 1}</span>
            <span className="truncate text-sm font-medium text-[var(--ink-1)]">
              {server.name || server.id || '未命名'}
            </span>
            <span className="shrink-0 border border-[var(--line-1)] px-1.5 py-0.5 text-[11px] text-[var(--ink-3)]">
              {server.transport === 'stdio' ? '本地' : '远程'}
            </span>
          </div>
          <div className="mt-1 truncate text-xs text-[var(--ink-3)]">
            {server.id || '未填写 ID'} · {endpoint || '未填写连接信息'}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Toggle
            checked={server.enabled}
            onCheckedChange={(checked) => onPatch(index, { enabled: checked })}
            disabled={!canUseMcp || isBusy}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpanded(index)}
            disabled={isBusy}
          >
            {isExpanded ? '收起' : '编辑'}
          </Button>
          <Button variant="danger" size="sm" onClick={() => onRemove(index)} disabled={isBusy}>
            删除
          </Button>
        </div>
      </div>

      {isExpanded ? (
        <div className="space-y-3 border-t border-[var(--line-1)] px-3 py-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="ID">
              <Input
                value={server.id}
                onChange={(event) => onPatch(index, { id: event.target.value })}
                className={fullInputClass}
                compact
                autoComplete="off"
                placeholder="filesystem"
                disabled={isBusy}
              />
            </Field>
            <Field label="名称">
              <Input
                value={server.name}
                onChange={(event) => onPatch(index, { name: event.target.value })}
                className={fullInputClass}
                compact
                autoComplete="off"
                placeholder="Filesystem MCP"
                disabled={isBusy}
              />
            </Field>
          </div>

          <Field label="连接方式">
            <div className="inline-grid min-w-[15rem] grid-cols-2 gap-1 border border-[var(--line-1)] bg-[var(--bg-1)] p-1">
              {[
                { value: 'http', label: '远程 URL' },
                { value: 'stdio', label: '本地命令' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={getSegmentButtonClassName(server.transport === option.value)}
                  onClick={() =>
                    onPatch(index, { transport: option.value as McpServerForm['transport'] })
                  }
                  disabled={isBusy}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>

          {server.transport === 'http' ? (
            <Field label="Streamable HTTP URL">
              <Input
                value={server.url ?? ''}
                onChange={(event) => onPatch(index, { url: event.target.value })}
                className={fullInputClass}
                compact
                autoComplete="off"
                placeholder="https://example.com/mcp"
                disabled={isBusy}
              />
            </Field>
          ) : (
            <Field label="命令">
              <Input
                value={server.command ?? ''}
                onChange={(event) => onPatch(index, { command: event.target.value })}
                className={fullInputClass}
                compact
                autoComplete="off"
                placeholder="npx"
                disabled={isBusy}
              />
            </Field>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {server.transport === 'http' ? (
              <Field label="Bearer Token">
                <Input
                  type="password"
                  value={server.bearerToken ?? ''}
                  onChange={(event) => onPatch(index, { bearerToken: event.target.value })}
                  className={fullInputClass}
                  compact
                  autoComplete="off"
                  disabled={isBusy}
                />
              </Field>
            ) : (
              <Field label="Args JSON">
                <textarea
                  value={server.argsText}
                  onChange={(event) => onPatch(index, { argsText: event.target.value })}
                  className={`${textareaClass} h-16 font-mono text-xs`}
                  spellCheck={false}
                  disabled={isBusy}
                />
              </Field>
            )}
            <Field label="超时毫秒">
              <Input
                type="number"
                min={5000}
                max={300000}
                value={server.timeoutMs}
                onChange={(event) =>
                  onPatch(index, {
                    timeoutMs: Number.parseInt(event.target.value, 10),
                  })
                }
                className={fullInputClass}
                compact
                disabled={isBusy}
              />
            </Field>
          </div>

          {server.transport === 'http' ? (
            <Field label="Headers JSON">
              <textarea
                value={server.headersText}
                onChange={(event) => onPatch(index, { headersText: event.target.value })}
                className={`${textareaClass} h-20 font-mono text-xs`}
                spellCheck={false}
                disabled={isBusy}
              />
            </Field>
          ) : (
            <Field label="Env JSON">
              <textarea
                value={server.envText}
                onChange={(event) => onPatch(index, { envText: event.target.value })}
                className={`${textareaClass} h-20 font-mono text-xs`}
                spellCheck={false}
                disabled={isBusy}
              />
            </Field>
          )}
        </div>
      ) : null}
    </div>
  );
};

