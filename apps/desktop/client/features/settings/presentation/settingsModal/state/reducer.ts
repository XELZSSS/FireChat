import { ProviderId, TavilyConfig } from '@/shared/types/chat';
import type { HttpProtocolPreference, SendShortcut } from '@/shared/utils/appOptions';
import type { LanguagePreference } from '@/shared/utils/i18n';
import type { AccentPreference, ThemePreference } from '@/shared/utils/theme';
import type {
  OpenAdapterToolKey,
  OpenAdapterToolSettings,
} from '@/infrastructure/providers/openadapterToolConfig';
import type { OpenAIRequestMode } from '@/infrastructure/providers/types';
import type { AiGatewaySettings } from '@/infrastructure/providers/aiGatewaySettings';
import type { CliSettings } from '@contracts/desktop';
import type { PetSettings } from '@client/features/pet/domain/petTypes';

export type ActiveSettingsTab =
  | 'provider'
  | 'customProvider'
  | 'mcp'
  | 'imageGeneration'
  | 'search'
  | 'requestLogs'
  | 'pet'
  | 'options';

export type SettingsProviderState = {
  providerId: ProviderId;
  modelName: string;
  systemPrompt: string;
  imageModelName: string;
  imageGeneration?: import('@/infrastructure/providers/imageGenerationSettings').ImageGenerationSettings;
  apiKey: string;
  requestMode?: OpenAIRequestMode;
  baseUrl?: string;
  customHeaders: Array<{ key: string; value: string }>;
  tavily: TavilyConfig;
  openAdapterTools: OpenAdapterToolSettings;
};

export type SettingsModalState = {
  provider: SettingsProviderState;
  app: {
    defaultProviderId: ProviderId;
    languagePreference: LanguagePreference;
    themePreference: ThemePreference;
    accentPreference: AccentPreference;
    sidebarCollapsed: boolean;
    uiFontFamily: string;
    uiFontSize: 'small' | 'medium' | 'large' | 'xlarge';
    sendShortcut: SendShortcut;
    showMessageTimestamps: boolean;
    wrapCodeBlocks: boolean;
    petSettings: PetSettings;
    reduceMotion: boolean;
    closeToTray: boolean;
    minimizeToTray: boolean;
    launchAtStartup: boolean;
    startMinimizedToTray: boolean;
    rememberWindowBounds: boolean;
    toolCallMaxRounds: string;
    httpProtocol: HttpProtocolPreference;
    localProxyHost: string;
    localProxyPort: string;
    aiGateway: AiGatewaySettings;
    cli: CliSettings;
  };
  ui: {
    showApiKey: boolean;
    showTavilyKey: boolean;
    activeTab: ActiveSettingsTab;
    interfaceLayoutConfigText: string;
    providerConfigJsonText: string;
  };
};

export type SettingsModalAction =
  | { type: 'replace'; payload: SettingsModalState }
  | { type: 'patch_provider'; payload: Partial<SettingsModalState['provider']> }
  | { type: 'patch_app'; payload: Partial<SettingsModalState['app']> }
  | { type: 'patch_ui'; payload: Partial<SettingsModalState['ui']> }
  | {
      type: 'set_tavily';
      payload: {
        key: keyof TavilyConfig;
        value: TavilyConfig[keyof TavilyConfig];
      };
    }
  | {
      type: 'set_openadapter_tool';
      payload: {
        key: OpenAdapterToolKey;
        value: boolean;
      };
    }
  | { type: 'add_custom_header' }
  | { type: 'remove_custom_header'; payload: { index: number } }
  | { type: 'set_custom_header_key'; payload: { index: number; value: string } }
  | { type: 'set_custom_header_value'; payload: { index: number; value: string } };

const patchCustomHeaderAtIndex = (
  state: SettingsModalState,
  index: number,
  payload: Partial<SettingsModalState['provider']['customHeaders'][number]>
): SettingsModalState => ({
  ...state,
  provider: {
    ...state.provider,
    customHeaders: state.provider.customHeaders.map((header, headerIndex) =>
      headerIndex === index ? { ...header, ...payload } : header
    ),
  },
});

export const settingsModalReducer = (
  state: SettingsModalState,
  action: SettingsModalAction
): SettingsModalState => {
  switch (action.type) {
    case 'replace':
      return action.payload;
    case 'patch_provider':
      return { ...state, provider: { ...state.provider, ...action.payload } };
    case 'patch_app':
      return { ...state, app: { ...state.app, ...action.payload } };
    case 'patch_ui':
      return { ...state, ui: { ...state.ui, ...action.payload } };
    case 'set_tavily':
      return {
        ...state,
        provider: {
          ...state.provider,
          tavily: { ...state.provider.tavily, [action.payload.key]: action.payload.value },
        },
      };
    case 'set_openadapter_tool':
      return {
        ...state,
        provider: {
          ...state.provider,
          openAdapterTools: {
            ...state.provider.openAdapterTools,
            [action.payload.key]: action.payload.value,
          },
        },
      };
    case 'add_custom_header':
      return {
        ...state,
        provider: {
          ...state.provider,
          customHeaders: [...state.provider.customHeaders, { key: '', value: '' }],
        },
      };
    case 'remove_custom_header':
      return {
        ...state,
        provider: {
          ...state.provider,
          customHeaders: state.provider.customHeaders.filter(
            (_, index) => index !== action.payload.index
          ),
        },
      };
    case 'set_custom_header_key':
      return patchCustomHeaderAtIndex(state, action.payload.index, { key: action.payload.value });
    case 'set_custom_header_value':
      return patchCustomHeaderAtIndex(state, action.payload.index, {
        value: action.payload.value,
      });
    default:
      return state;
  }
};
