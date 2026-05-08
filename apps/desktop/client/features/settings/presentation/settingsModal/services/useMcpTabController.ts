import { useEffect, useState } from 'react';
import type { McpToolListResult } from '@contracts/desktop';
import {
  createEmptyMcpServerForm,
  toMcpConfig,
  toMcpServerForm,
  validateMcpServers,
  type McpServerForm,
} from '@client/features/settings/presentation/settingsModal/sections/mcpTabConfig';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const useMcpTabController = () => {
  const [enabled, setEnabled] = useState(false);
  const [servers, setServers] = useState<McpServerForm[]>([]);
  const [statusText, setStatusText] = useState('');
  const [toolResult, setToolResult] = useState<McpToolListResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [expandedServerIndex, setExpandedServerIndex] = useState<number | null>(null);
  const canUseMcp = Boolean(window.firechat?.mcp);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      if (!window.firechat?.mcp) {
        return;
      }

      try {
        const config = await window.firechat.mcp.getConfig();
        if (!cancelled) {
          setEnabled(config.enabled);
          setServers(config.servers.map(toMcpServerForm));
        }
      } catch (error) {
        if (!cancelled) {
          setStatusText(getErrorMessage(error));
        }
      }
    };

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  const patchServer = (index: number, updates: Partial<McpServerForm>) => {
    setServers((current) =>
      current.map((server, serverIndex) =>
        serverIndex === index ? { ...server, ...updates } : server
      )
    );
  };

  const addServer = () => {
    setStatusText('');
    setServers((current) => {
      setExpandedServerIndex(current.length);
      return [...current, createEmptyMcpServerForm()];
    });
  };

  const removeServer = (index: number) => {
    setStatusText('');
    setExpandedServerIndex(null);
    setServers((current) => current.filter((_, serverIndex) => serverIndex !== index));
  };

  const toggleExpandedServer = (index: number) => {
    setExpandedServerIndex((current) => (current === index ? null : index));
  };

  const saveConfig = async () => {
    if (!window.firechat?.mcp) {
      return;
    }

    setIsBusy(true);
    setStatusText('');
    try {
      validateMcpServers(servers);
      const saved = await window.firechat.mcp.saveConfig(toMcpConfig(enabled, servers));
      setEnabled(saved.enabled);
      setServers(saved.servers.map(toMcpServerForm));
      const result = await window.firechat.mcp.listTools();
      setToolResult(result);
      setStatusText(
        `已保存 ${saved.servers.length} 个 MCP。可用工具：${result.tools.length}，错误：${result.errors.length}`
      );
    } catch (error) {
      setStatusText(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const testConfig = async () => {
    if (!window.firechat?.mcp) {
      return;
    }

    setIsBusy(true);
    setStatusText('');
    try {
      const result = await window.firechat.mcp.reload();
      setToolResult(result);
      setStatusText(`连接完成。可用工具：${result.tools.length}，错误：${result.errors.length}`);
    } catch (error) {
      setStatusText(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const testCurrentConfig = async () => {
    if (!window.firechat?.mcp) {
      return;
    }

    setIsBusy(true);
    setStatusText('');
    try {
      validateMcpServers(servers);
      const result = await window.firechat.mcp.testConfig(toMcpConfig(enabled, servers));
      setToolResult(result);
      setStatusText(`当前配置可用工具：${result.tools.length}，错误：${result.errors.length}`);
    } catch (error) {
      setStatusText(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  return {
    addServer,
    canUseMcp,
    enabled,
    isBusy,
    expandedServerIndex,
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
  };
};

