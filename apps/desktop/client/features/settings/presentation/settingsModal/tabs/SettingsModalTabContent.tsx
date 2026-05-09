import ProviderTab from '@client/features/settings/presentation/settingsModal/tabs/ProviderTab';
import CustomProviderTab from '@client/features/settings/presentation/settingsModal/tabs/CustomProviderTab';
import AiGatewayTab from '@client/features/settings/presentation/settingsModal/tabs/AiGatewayTab';
import CliTab from '@client/features/settings/presentation/settingsModal/tabs/CliTab';
import McpTab from '@client/features/settings/presentation/settingsModal/tabs/McpTab';
import ImageGenerationTab from '@client/features/settings/presentation/settingsModal/tabs/ImageGenerationTab';
import SearchTab from '@client/features/settings/presentation/settingsModal/tabs/SearchTab';
import RequestLogsTab from '@client/features/settings/presentation/settingsModal/tabs/RequestLogsTab';
import PetTab from '@client/features/settings/presentation/settingsModal/tabs/PetTab';
import OptionsTab from '@client/features/settings/presentation/settingsModal/tabs/OptionsTab';
import type { SettingsTabContentBuildContext } from '@client/features/settings/presentation/settingsModal/tabs/tabContentBuilders';
import {
  buildCustomProviderTabProps,
  buildImageGenerationTabProps,
  buildOptionsTabProps,
  buildProviderTabProps,
  buildSearchTabProps,
} from '@client/features/settings/presentation/settingsModal/tabs/tabContentBuilders';

type SettingsModalTabContentProps = SettingsTabContentBuildContext;

export const SettingsModalTabContent = ({
  controller,
  ...context
}: SettingsModalTabContentProps) => {
  const { state } = controller;
  const tabContext = { controller, ...context };

  switch (state.ui.activeTab) {
    case 'provider':
      return <ProviderTab {...buildProviderTabProps(tabContext)} />;
    case 'customProvider':
      return <CustomProviderTab {...buildCustomProviderTabProps(tabContext)} />;
    case 'aiGateway':
      return (
        <AiGatewayTab
          aiGateway={state.app.aiGateway}
          mutationsLockedReason={context.interactionLockReason}
          validationIssuesByField={controller.validation.issuesByField}
          onAiGatewayChange={controller.aiGatewayActions.onAiGatewayChange}
        />
      );
    case 'cli':
      return (
        <CliTab
          cli={state.app.cli}
          mutationsLockedReason={context.interactionLockReason}
          onCliSettingsChange={controller.cliActions.onCliSettingsChange}
        />
      );
    case 'mcp':
      return <McpTab />;
    case 'imageGeneration':
      return <ImageGenerationTab {...buildImageGenerationTabProps(tabContext)} />;
    case 'search':
      return context.activeMeta?.supportsTavily ? (
        <SearchTab {...buildSearchTabProps(tabContext)} />
      ) : null;
    case 'requestLogs':
      return <RequestLogsTab mutationsLockedReason={context.interactionLockReason} />;
    case 'pet':
      return (
        <PetTab
          petSettings={state.app.petSettings}
          mutationsLockedReason={context.interactionLockReason}
          onPetSettingsChange={controller.optionsActions.onPetSettingsChange}
        />
      );
    case 'options':
      return <OptionsTab {...buildOptionsTabProps(tabContext)} />;
    default:
      return null;
  }
};
