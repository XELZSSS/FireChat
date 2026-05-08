import type { UpdaterStatus } from '@contracts/updater';
import type { FireChatRuntimeEnv } from '@contracts/runtime-config';
import type { ProviderFileSnapshot } from '@contracts/provider-config';
import type {
  AppendRequestLogPayload,
  ClearRequestLogsResult,
  RequestLogQuery,
  RequestLogQueryResult,
  RequestLogRecord,
} from '@contracts/request-log';
import type { ChatSession } from '@contracts/chat';

export type McpServerTransport = 'http' | 'stdio';

export type McpServerConfig = {
  id: string;
  name: string;
  transport: McpServerTransport;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  enabled: boolean;
  timeoutMs: number;
  bearerToken?: string;
  headers?: Record<string, string>;
};

export type McpConfig = {
  enabled: boolean;
  servers: McpServerConfig[];
};

export type McpToolInfo = {
  key: string;
  serverId: string;
  serverName: string;
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, unknown>;
};

export type McpToolListResult = {
  tools: McpToolInfo[];
  errors: Array<{
    serverId: string;
    message: string;
  }>;
};

export type McpToolCallPayload = {
  serverId: string;
  toolName: string;
  arguments?: Record<string, unknown>;
};

export type SearchMcpEngine = 'exa' | 'tavily' | 'firecrawl' | 'searxng';

export type SearchMcpPayload = {
  engine: SearchMcpEngine;
  query: string;
  maxResults?: number;
  apiKey?: string;
  searchDepth?: 'basic' | 'advanced' | 'fast' | 'ultra-fast';
  topic?: 'general' | 'news';
  searxngBaseUrl?: string;
  searxngLanguage?: string;
  searxngTimeRange?: 'day' | 'month' | 'year';
  searxngSafeSearch?: 0 | 1 | 2;
  firecrawlLocation?: string;
  firecrawlCountry?: string;
  firecrawlScrapeContent?: boolean;
};

export type McpToolCallResult = {
  serverId: string;
  toolName: string;
  isError: boolean;
  content: unknown[];
  structuredContent?: Record<string, unknown>;
};

export type CliProviderId = 'codex' | 'claude-code';

export type CliProviderKey = 'codex' | 'claudeCode';

export type CliProviderConnectionSettings = {
  enabled: boolean;
  command: string;
  workingDirectory: string;
};

export type CliSettings = Record<CliProviderKey, CliProviderConnectionSettings>;

export type CliProviderRuntimeStatus = {
  enabled: boolean;
  running: boolean;
  connected: boolean;
  status: 'disabled' | 'stopped' | 'starting' | 'connected' | 'running' | 'error';
  message?: string;
};

export type CliProviderStatusMap = Record<CliProviderKey, CliProviderRuntimeStatus>;

export type CliPromptPayload = {
  provider: CliProviderId;
  prompt: string;
  model?: string;
  sessionId?: string;
  workingDirectory?: string;
};

export type CliPromptResult = {
  text: string;
  sessionId?: string;
};

export type CliSessionCleanupPayload = {
  codex?: string;
  claudeCode?: string;
};

export type CliSessionCleanupProviderResult = {
  ok: boolean;
  action: 'archived' | 'deleted' | 'skipped';
  deletedFiles?: number;
  message?: string;
};

export type CliSessionCleanupResult = {
  codex?: CliSessionCleanupProviderResult;
  claudeCode?: CliSessionCleanupProviderResult;
};

export type AppStorageWritePayload = {
  key: string;
  value: string;
};

export type ChatSessionSavePayload = ChatSession & {
  searchText: string;
};

export interface FireChatDesktopBridge {
  config: {
    env: FireChatRuntimeEnv;
    providerFiles: ProviderFileSnapshot;
    interfaceLayout: {
      interfaceCard: string[][];
      fontCss: string[];
      colorCss: string[];
    };
  };
  window: {
    minimize: () => Promise<void>;
    toggleMaximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    getAppVersion: () => Promise<string>;
    getSystemLanguage: () => Promise<string>;
    getSystemTheme: () => Promise<'dark' | 'light'>;
    onMaximizeChanged: (callback: (isMaximized: boolean) => void) => () => void;
    onSystemLanguageChanged: (callback: () => void) => () => void;
    onSystemThemeChanged: (callback: () => void) => () => void;
  };
  updater: {
    check: () => Promise<void>;
    openDownload: () => Promise<void>;
    getStatus: () => Promise<UpdaterStatus>;
    onStatus: (callback: (status: UpdaterStatus) => void) => () => void;
  };
  app: {
    openExternal: (url: string) => Promise<void>;
    openLocalConfig: () => Promise<void>;
    openConfigDirectory: () => Promise<void>;
    exportOptionsConfig: (payload: Record<string, unknown>) => Promise<{
      canceled: boolean;
      filePath?: string;
    }>;
    importOptionsConfig: () => Promise<{
      canceled: boolean;
      filePath?: string;
      value?: unknown;
    }>;
    getInterfaceLayoutConfig: () => Promise<{
      interfaceCard: string[][];
      fontCss: string[];
      colorCss: string[];
    }>;
    saveInterfaceLayoutConfig: (payload: {
      interfaceCard: string[][];
      fontCss: string[];
      colorCss: string[];
    }) => Promise<{
      interfaceCard: string[][];
      fontCss: string[];
      colorCss: string[];
    }>;
    getProviderConfigSnapshot: () => Promise<ProviderFileSnapshot>;
    saveProviderConfigSnapshot: (payload: ProviderFileSnapshot) => Promise<ProviderFileSnapshot>;
    getLocalProxyBaseUrl: () => Promise<string>;
    getLocalProxyConfig: () => Promise<{
      host: string;
      port: number;
      baseUrl: string;
    }>;
    syncLocalProxyConfig: (payload: { host: string; port: string }) => Promise<{
      host: string;
      port: number;
      baseUrl?: string;
    }>;
    updateStartupAppearance: (payload: {
      themePreference: 'dark' | 'light';
      theme: 'dark' | 'light';
      accentPreference:
        | 'neutral'
        | 'blue'
        | 'indigo'
        | 'sky'
        | 'cyan'
        | 'teal'
        | 'green'
        | 'emerald'
        | 'mint'
        | 'lime'
        | 'yellow'
        | 'amber'
        | 'gold'
        | 'orange'
        | 'coral'
        | 'rose'
        | 'pink'
        | 'magenta'
        | 'fuchsia'
        | 'red'
        | 'crimson'
        | 'purple'
        | 'lavender'
        | 'plum'
        | 'violet';
    }) => Promise<{
      runtime: 'electron';
      themePreference: 'dark' | 'light';
      theme: 'dark' | 'light';
      accentPreference:
        | 'neutral'
        | 'blue'
        | 'indigo'
        | 'sky'
        | 'cyan'
        | 'teal'
        | 'green'
        | 'emerald'
        | 'mint'
        | 'lime'
        | 'yellow'
        | 'amber'
        | 'gold'
        | 'orange'
        | 'coral'
        | 'rose'
        | 'pink'
        | 'magenta'
        | 'fuchsia'
        | 'red'
        | 'crimson'
        | 'purple'
        | 'lavender'
        | 'plum'
        | 'violet';
      backgroundColor: string;
    }>;
    updateLocalProxyConfig: (payload: { host: string; port: string }) => Promise<{
      host: string;
      port: number;
      baseUrl: string;
    }>;
    updateWindowBehavior: (payload: {
      closeToTray: boolean;
      minimizeToTray: boolean;
      launchAtStartup?: boolean;
      startMinimizedToTray?: boolean;
      rememberWindowBounds?: boolean;
    }) => Promise<{
      closeToTray: boolean;
      minimizeToTray: boolean;
      launchAtStartup: boolean;
      startMinimizedToTray: boolean;
      rememberWindowBounds: boolean;
    }>;
    getCliProviderStatus: () => Promise<CliProviderStatusMap>;
    syncCliProviderConfig: (payload: CliSettings) => Promise<CliProviderStatusMap>;
    runCliPrompt: (payload: CliPromptPayload) => Promise<CliPromptResult>;
    stopCliProvider: (provider: CliProviderId) => Promise<CliProviderStatusMap>;
    cleanupCliSessions: (payload: CliSessionCleanupPayload) => Promise<CliSessionCleanupResult>;
    appendRequestLog: (payload: AppendRequestLogPayload) => Promise<RequestLogRecord>;
    queryRequestLogs: (payload?: RequestLogQuery) => Promise<RequestLogQueryResult>;
    clearRequestLogs: () => Promise<ClearRequestLogsResult>;
    parseAttachment: (payload: {
      fileName: string;
      mimeType?: string;
      bytes: Uint8Array | ArrayBuffer;
      pageRange?: string;
    }) => Promise<{
      mimeType: string;
      textContent: string;
    }>;
    resetLocalData: () => Promise<{
      ok: boolean;
      relaunching?: boolean;
      action?: 'exit' | 'relaunch';
    }>;
  };
  storage: {
    readAppStorage: (key: string) => string | null;
    writeAppStorage: (payload: AppStorageWritePayload) => Promise<void>;
    removeAppStorage: (key: string) => Promise<void>;
    getSessionSummaries: (limit?: number) => Promise<ChatSession[]>;
    getSession: (sessionId: string) => Promise<ChatSession | null>;
    saveSession: (payload: ChatSessionSavePayload) => Promise<void>;
    updateSessionTitle: (payload: { sessionId: string; title: string }) => Promise<ChatSession[]>;
    deleteSession: (sessionId: string) => Promise<ChatSession[]>;
    searchSessionSummaries: (payload: { query: string; limit?: number }) => Promise<ChatSession[]>;
    getActiveSessionId: () => Promise<string | null>;
    setActiveSessionId: (sessionId: string) => Promise<void>;
    clearActiveSessionId: () => Promise<void>;
  };
  mcp: {
    getConfig: () => Promise<McpConfig>;
    saveConfig: (payload: McpConfig) => Promise<McpConfig>;
    reload: () => Promise<McpToolListResult>;
    getServers: () => Promise<{
      enabled: boolean;
      servers: Array<Omit<McpServerConfig, 'bearerToken' | 'headers'> & { connected: boolean }>;
    }>;
    listTools: () => Promise<McpToolListResult>;
    testConfig: (payload: McpConfig) => Promise<McpToolListResult>;
    callTool: (payload: McpToolCallPayload) => Promise<McpToolCallResult>;
    callSearch: (payload: SearchMcpPayload) => Promise<McpToolCallResult>;
  };
  tray: {
    setLanguage: (language: 'en' | 'zh-CN') => Promise<void>;
    setLabels: (labels: {
      open: string;
      hide: string;
      toggleDevTools: string;
      quit: string;
    }) => Promise<void>;
  };
}
