import type { Language } from '@/shared/utils/i18n';
import type { ProviderFileSnapshot } from '@contracts/provider-config';
import type { FireChatDesktopBridge } from '@contracts/desktop';
import type {
  AppendRequestLogPayload,
  ClearRequestLogsResult,
  RequestLogQuery,
  RequestLogQueryResult,
  RequestLogRecord,
} from '@contracts/request-log';
import {
  getBridgeNamespace,
  hasFireChatBridge,
  noopUnsubscribe,
} from '@client/features/desktop-shell/infrastructure/firechatBridge';
import { setCachedLocalProxyBaseUrl } from '@/infrastructure/network/proxyFetch';

type TrayLabels = {
  open: string;
  hide: string;
  toggleDevTools: string;
  quit: string;
};

type AttachmentPayload = {
  fileName: string;
  mimeType?: string;
  bytes: Uint8Array | ArrayBuffer;
  pageRange?: string;
};

const BRIDGE_UNAVAILABLE_ERROR = 'FireChat bridge is unavailable in the renderer window.';

const getBridgeOrNull = <K extends keyof FireChatDesktopBridge>(
  namespace: K
): FireChatDesktopBridge[K] | null => (hasFireChatBridge() ? getBridgeNamespace(namespace) : null);

const getRequiredAppBridge = (): FireChatDesktopBridge['app'] => {
  const appBridge = getBridgeOrNull('app');
  if (!appBridge) {
    throw new Error(BRIDGE_UNAVAILABLE_ERROR);
  }

  return appBridge;
};

export const isDesktopEnvironment = (): boolean => hasFireChatBridge();

export const minimizeAppWindow = async (): Promise<void> => {
  await getBridgeOrNull('window')?.minimize();
};

export const toggleAppWindowMaximize = async (): Promise<void> => {
  await getBridgeOrNull('window')?.toggleMaximize();
};

export const closeAppWindow = async (): Promise<void> => {
  await getBridgeOrNull('window')?.close();
};

export const getAppWindowMaximized = async (): Promise<boolean> => {
  return (await getBridgeOrNull('window')?.isMaximized()) ?? false;
};

export const onAppWindowMaximizeChanged = (
  callback: (maximized: boolean) => void
): (() => void) => {
  return getBridgeOrNull('window')?.onMaximizeChanged(callback) ?? noopUnsubscribe;
};

export const getDesktopAppVersion = async (): Promise<string | null> => {
  return (await getBridgeOrNull('window')?.getAppVersion()) ?? null;
};

export const openExternalUrl = async (url: string): Promise<boolean> => {
  const appBridge = getBridgeOrNull('app');
  if (!appBridge) return false;
  await appBridge.openExternal(url);
  return true;
};

export const setDesktopTrayLanguage = async (language: Language): Promise<void> => {
  await getBridgeOrNull('tray')?.setLanguage(language);
};

export const setDesktopTrayLabels = async (labels: TrayLabels): Promise<void> => {
  await getBridgeOrNull('tray')?.setLabels(labels);
};

export const resetDesktopLocalData = async () => {
  return getRequiredAppBridge().resetLocalData();
};

export const openDesktopConfigDirectory = async (): Promise<void> => {
  await getRequiredAppBridge().openConfigDirectory();
};

export const exportDesktopOptionsConfig = async (payload: Record<string, unknown>) => {
  return getRequiredAppBridge().exportOptionsConfig(payload);
};

export const importDesktopOptionsConfig = async () => {
  return getRequiredAppBridge().importOptionsConfig();
};

export const getDesktopProviderConfigSnapshot = async (): Promise<ProviderFileSnapshot> => {
  return getRequiredAppBridge().getProviderConfigSnapshot();
};

export const getDesktopInterfaceLayoutConfig = async () => {
  return getRequiredAppBridge().getInterfaceLayoutConfig();
};

export const saveDesktopInterfaceLayoutConfig = async (payload: {
  interfaceCard: string[][];
  fontCss: string[];
  colorCss: string[];
}) => {
  return getRequiredAppBridge().saveInterfaceLayoutConfig(payload);
};

export const saveDesktopProviderConfigSnapshot = async (
  payload: ProviderFileSnapshot
): Promise<ProviderFileSnapshot> => {
  return getRequiredAppBridge().saveProviderConfigSnapshot(payload);
};

export const parseDesktopAttachment = async (payload: AttachmentPayload) => {
  return getRequiredAppBridge().parseAttachment(payload);
};

export const getDesktopLocalProxyConfig = async () => {
  const config = await getRequiredAppBridge().getLocalProxyConfig();
  setCachedLocalProxyBaseUrl(config.baseUrl ?? null);
  return config;
};

export const updateDesktopLocalProxyConfig = async (payload: { host: string; port: string }) => {
  const config = await getRequiredAppBridge().updateLocalProxyConfig(payload);
  setCachedLocalProxyBaseUrl(config.baseUrl ?? null);
  return config;
};

export const updateDesktopWindowBehavior = async (payload: {
  closeToTray: boolean;
  minimizeToTray: boolean;
  launchAtStartup?: boolean;
  startMinimizedToTray?: boolean;
  rememberWindowBounds?: boolean;
}) => {
  return getRequiredAppBridge().updateWindowBehavior(payload);
};

export const syncDesktopLocalProxyConfig = async (payload: { host: string; port: string }) => {
  const config = await getRequiredAppBridge().syncLocalProxyConfig(payload);
  setCachedLocalProxyBaseUrl(config.baseUrl ?? null);
  return config;
};

export const appendDesktopRequestLog = async (
  payload: AppendRequestLogPayload
): Promise<RequestLogRecord | null> => {
  return (await getBridgeOrNull('app')?.appendRequestLog(payload)) ?? null;
};

export const queryDesktopRequestLogs = async (
  payload: RequestLogQuery = {}
): Promise<RequestLogQueryResult> => {
  return (await getBridgeOrNull('app')?.queryRequestLogs(payload)) ?? { items: [], total: 0 };
};

export const clearDesktopRequestLogs = async (): Promise<ClearRequestLogsResult> => {
  return (await getBridgeOrNull('app')?.clearRequestLogs()) ?? { cleared: 0 };
};

export const updateDesktopStartupAppearance = async (payload: {
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
}) => {
  return (await getBridgeOrNull('app')?.updateStartupAppearance(payload)) ?? null;
};
