import { useCallback, useMemo, type Dispatch } from 'react';
import { TavilyConfig } from '@/shared/types/chat';
import type { OpenAdapterToolKey } from '@/infrastructure/providers/openadapterToolConfig';
import type { OpenAIRequestMode } from '@/infrastructure/providers/types';
import type { ImageGenerationSettings } from '@/infrastructure/providers/imageGenerationSettings';
import type { LanguagePreference } from '@/shared/utils/i18n';
import type { AppFontSize, HttpProtocolPreference, SendShortcut } from '@/shared/utils/appOptions';
import type { AccentPreference, ThemePreference } from '@/shared/utils/theme';
import type { AiGatewaySettings } from '@/infrastructure/providers/aiGatewaySettings';
import type { CliSettings } from '@contracts/desktop';
import type { PetSettings } from '@client/features/pet/domain/petTypes';
import { resolveBaseUrlForRegion } from '@/infrastructure/providers/config/baseUrl';
import {
  createDefaultInterfaceLayoutConfigText,
  createDefaultOptionsPatch,
  createImportedOptionsState,
} from '@client/features/settings/presentation/settingsModal/state/optionsActionState';
import { normalizeToolCallRounds } from '@client/features/settings/presentation/settingsModal/actions/controllerHelpers';
import {
  ActiveSettingsTab,
  SettingsModalAction,
  SettingsModalState,
} from '@client/features/settings/presentation/settingsModal/state/reducer';

type ProviderFieldSetter = <K extends keyof SettingsModalState['provider']>(
  key: K,
  value: SettingsModalState['provider'][K]
) => void;

type AppFieldSetter = <K extends keyof SettingsModalState['app']>(
  key: K,
  value: SettingsModalState['app'][K]
) => void;

type UiFieldSetter = <K extends keyof SettingsModalState['ui']>(
  key: K,
  value: SettingsModalState['ui'][K]
) => void;

type UseSettingsControllerActionsOptions = {
  dispatch: Dispatch<SettingsModalAction>;
  state: SettingsModalState;
  handleProviderChange: (providerId: SettingsModalState['provider']['providerId']) => void;
  setProviderField: ProviderFieldSetter;
  setAppField: AppFieldSetter;
  setUiField: UiFieldSetter;
};

export const useSettingsControllerActions = ({
  dispatch,
  state,
  handleProviderChange,
  setProviderField,
  setAppField,
  setUiField,
}: UseSettingsControllerActionsOptions) => {
  const { providerId } = state.provider;
  const { toolCallMaxRounds } = state.app;
  const { showApiKey, showTavilyKey } = state.ui;

  const setTavilyField = useCallback(
    (key: keyof TavilyConfig, value: TavilyConfig[keyof TavilyConfig]) =>
      dispatch({
        type: 'patch_provider',
        payload: { tavily: { ...state.provider.tavily, [key]: value } },
      }),
    [dispatch, state.provider.tavily]
  );

  const addCustomHeader = useCallback(() => dispatch({ type: 'add_custom_header' }), [dispatch]);
  const setCustomHeaderKey = useCallback(
    (index: number, value: string) =>
      dispatch({ type: 'set_custom_header_key', payload: { index, value } }),
    [dispatch]
  );
  const setCustomHeaderValue = useCallback(
    (index: number, value: string) =>
      dispatch({ type: 'set_custom_header_value', payload: { index, value } }),
    [dispatch]
  );
  const removeCustomHeader = useCallback(
    (index: number) => dispatch({ type: 'remove_custom_header', payload: { index } }),
    [dispatch]
  );
  const handleProviderSelection = useCallback(
    (nextProviderId: SettingsModalState['provider']['providerId']) => {
      handleProviderChange(nextProviderId);
    },
    [handleProviderChange]
  );
  const handleSetDefaultProvider = useCallback(
    () => setAppField('defaultProviderId', providerId),
    [providerId, setAppField]
  );
  const handleToggleApiKeyVisibility = useCallback(
    () => setUiField('showApiKey', !showApiKey),
    [setUiField, showApiKey]
  );
  const handleToolCallMaxRoundsBlur = useCallback(
    () => setAppField('toolCallMaxRounds', normalizeToolCallRounds(toolCallMaxRounds)),
    [setAppField, toolCallMaxRounds]
  );
  const handleSetRegionBaseUrl = useCallback(
    (region: 'intl' | 'cn') =>
      setProviderField('baseUrl', resolveBaseUrlForRegion(providerId, region)),
    [providerId, setProviderField]
  );
  const handleToggleTavilyKeyVisibility = useCallback(
    () => setUiField('showTavilyKey', !showTavilyKey),
    [setUiField, showTavilyKey]
  );
  const handleSetOpenAdapterToolEnabled = useCallback(
    (key: OpenAdapterToolKey, value: boolean) =>
      dispatch({
        type: 'patch_provider',
        payload: {
          openAdapterTools: { ...state.provider.openAdapterTools, [key]: value },
        },
      }),
    [dispatch, state.provider.openAdapterTools]
  );

  const providerActions = useMemo(
    () => ({
      onProviderChange: handleProviderSelection,
      onSetDefaultProvider: handleSetDefaultProvider,
      onModelNameChange: (value: string) => setProviderField('modelName', value),
      onSystemPromptChange: (value: string) => setProviderField('systemPrompt', value),
      onImageModelNameChange: (value: string) => setProviderField('imageModelName', value),
      onImageGenerationChange: (value: ImageGenerationSettings) =>
        setProviderField('imageGeneration', value),
      onApiKeyChange: (value: string) => setProviderField('apiKey', value),
      onRequestModeChange: (value: OpenAIRequestMode) => setProviderField('requestMode', value),
      onToggleApiKeyVisibility: handleToggleApiKeyVisibility,
      onClearApiKey: () => setProviderField('apiKey', ''),
      onToolCallMaxRoundsChange: (value: string) => setAppField('toolCallMaxRounds', value),
      onToolCallMaxRoundsBlur: handleToolCallMaxRoundsBlur,
      onBaseUrlChange: (value: string) => setProviderField('baseUrl', value),
      onProviderConfigJsonTextChange: (value: string) =>
        setUiField('providerConfigJsonText', value),
      onAddCustomHeader: addCustomHeader,
      onSetCustomHeaderKey: setCustomHeaderKey,
      onSetCustomHeaderValue: setCustomHeaderValue,
      onRemoveCustomHeader: removeCustomHeader,
      onSetRegionBaseUrl: handleSetRegionBaseUrl,
      onSetOpenAdapterToolEnabled: handleSetOpenAdapterToolEnabled,
    }),
    [
      addCustomHeader,
      handleProviderSelection,
      handleSetDefaultProvider,
      handleSetRegionBaseUrl,
      handleSetOpenAdapterToolEnabled,
      handleToggleApiKeyVisibility,
      handleToolCallMaxRoundsBlur,
      removeCustomHeader,
      setAppField,
      setCustomHeaderKey,
      setCustomHeaderValue,
      setProviderField,
      setUiField,
    ]
  );

  const searchActions = useMemo(
    () => ({
      onSetTavilyField: setTavilyField,
      onToggleTavilyKeyVisibility: handleToggleTavilyKeyVisibility,
    }),
    [handleToggleTavilyKeyVisibility, setTavilyField]
  );

  const aiGatewayActions = useMemo(
    () => ({
      onAiGatewayChange: (value: AiGatewaySettings) => setAppField('aiGateway', value),
    }),
    [setAppField]
  );

  const cliActions = useMemo(
    () => ({
      onCliSettingsChange: (value: CliSettings) => setAppField('cli', value),
    }),
    [setAppField]
  );

  const onTabChange = useCallback(
    (id: ActiveSettingsTab) => setUiField('activeTab', id),
    [setUiField]
  );

  const appearanceActions = useMemo(
    () => ({
      onLanguagePreferenceChange: (value: LanguagePreference) =>
        setAppField('languagePreference', value),
      onThemePreferenceChange: (value: ThemePreference) => setAppField('themePreference', value),
      onAccentPreferenceChange: (value: AccentPreference) => setAppField('accentPreference', value),
    }),
    [setAppField]
  );

  const versionTabActions = useMemo(
    () => ({
      onHttpProtocolChange: (value: HttpProtocolPreference) => setAppField('httpProtocol', value),
      onLocalProxyHostChange: (value: string) => setAppField('localProxyHost', value),
      onLocalProxyPortChange: (value: string) => setAppField('localProxyPort', value),
    }),
    [setAppField]
  );

  const optionsActions = useMemo(
    () => ({
      onUiFontFamilyChange: (value: string) => setAppField('uiFontFamily', value),
      onUiFontSizeChange: (value: AppFontSize) => setAppField('uiFontSize', value),
      onInterfaceLayoutConfigTextChange: (value: string) =>
        setUiField('interfaceLayoutConfigText', value),
      onSendShortcutChange: (value: SendShortcut) => setAppField('sendShortcut', value),
      onToggleShowMessageTimestamps: (value: boolean) =>
        setAppField('showMessageTimestamps', value),
      onToggleWrapCodeBlocks: (value: boolean) => setAppField('wrapCodeBlocks', value),
      onPetSettingsChange: (value: PetSettings) => setAppField('petSettings', value),
      onToggleReduceMotion: (value: boolean) => setAppField('reduceMotion', value),
      onToggleSidebarCollapsed: (value: boolean) => setAppField('sidebarCollapsed', value),
      onToggleCloseToTray: (value: boolean) => setAppField('closeToTray', value),
      onToggleMinimizeToTray: (value: boolean) => setAppField('minimizeToTray', value),
      onToggleLaunchAtStartup: (value: boolean) => setAppField('launchAtStartup', value),
      onToggleStartMinimizedToTray: (value: boolean) => setAppField('startMinimizedToTray', value),
      onToggleRememberWindowBounds: (value: boolean) => setAppField('rememberWindowBounds', value),
      onResetOptions: () => {
        dispatch({
          type: 'patch_app',
          payload: createDefaultOptionsPatch(),
        });
        setUiField('interfaceLayoutConfigText', createDefaultInterfaceLayoutConfigText());
      },
      onImportOptions: (value: unknown) => {
        const importedState = createImportedOptionsState(value, state.app);
        dispatch({
          type: 'patch_app',
          payload: importedState.appPatch,
        });
        if (importedState.interfaceLayoutConfigText) {
          setUiField('interfaceLayoutConfigText', importedState.interfaceLayoutConfigText);
        }
      },
    }),
    [dispatch, setAppField, setUiField, state.app]
  );

  return {
    onTabChange,
    providerActions,
    searchActions,
    aiGatewayActions,
    cliActions,
    appearanceActions,
    versionActions: versionTabActions,
    optionsActions,
  };
};

