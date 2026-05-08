import type { ComponentType } from 'react';
import { TavilyConfig } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';
import {
  SearchEngineSection,
  SearchTabLayout,
} from '@client/features/settings/presentation/settingsModal/sections/SearchTabSections';
import { ExaEngineSection } from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/ExaEngineSection';
import { FirecrawlEngineSection } from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/FirecrawlEngineSection';
import { SearxngEngineSection } from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/SearxngEngineSection';
import { TavilyEngineSection } from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/TavilyEngineSection';

type SearchTabProps = {
  tavily: TavilyConfig;
  showTavilyKey: boolean;
  toolCallMaxRounds: string;
  validationIssuesByField: Record<string, SettingsValidationIssue[]>;
  onSetTavilyField: <K extends keyof TavilyConfig>(key: K, value: TavilyConfig[K]) => void;
  onToggleTavilyKeyVisibility: () => void;
  onToolCallMaxRoundsChange: (value: string) => void;
  onToolCallMaxRoundsBlur: () => void;
};

type SearchEngineId = 'tavily' | 'exa' | 'searxng' | 'firecrawl';

type SearchEngineSectionProps = Pick<
  SearchTabProps,
  | 'tavily'
  | 'toolCallMaxRounds'
  | 'validationIssuesByField'
  | 'onSetTavilyField'
  | 'onToolCallMaxRoundsChange'
  | 'onToolCallMaxRoundsBlur'
>;

const SEARCH_ENGINE_SECTION_BY_ID: Record<
  SearchEngineId,
  ComponentType<SearchEngineSectionProps>
> = {
  tavily: TavilyEngineSection,
  exa: ExaEngineSection,
  searxng: SearxngEngineSection,
  firecrawl: FirecrawlEngineSection,
};

const SearchTab = ({
  tavily,
  showTavilyKey,
  toolCallMaxRounds,
  validationIssuesByField,
  onSetTavilyField,
  onToggleTavilyKeyVisibility,
  onToolCallMaxRoundsChange,
  onToolCallMaxRoundsBlur,
}: SearchTabProps) => {
  const activeEngine: SearchEngineId =
    tavily.engine === 'exa' || tavily.engine === 'searxng' || tavily.engine === 'firecrawl'
      ? tavily.engine
      : 'tavily';
  const tavilyKeyLabel = showTavilyKey ? t('settings.apiKey.hide') : t('settings.apiKey.show');
  const apiKeyLabel =
    activeEngine === 'exa'
      ? t('settings.modal.search.apiKey.exaMcp')
      : activeEngine === 'firecrawl'
        ? t('settings.modal.search.apiKey.firecrawl')
        : t('settings.modal.search.apiKey.tavily');
  const ActiveEngineSection = SEARCH_ENGINE_SECTION_BY_ID[activeEngine];

  return (
    <SearchTabLayout>
      <SearchEngineSection
        tavily={tavily}
        activeEngine={activeEngine}
        showTavilyKey={showTavilyKey}
        validationIssuesByField={validationIssuesByField}
        tavilyKeyLabel={tavilyKeyLabel}
        apiKeyLabel={apiKeyLabel}
        onSetTavilyField={onSetTavilyField}
        onToggleTavilyKeyVisibility={onToggleTavilyKeyVisibility}
      />

      <div className="space-y-3">
        <ActiveEngineSection
          tavily={tavily}
          toolCallMaxRounds={toolCallMaxRounds}
          validationIssuesByField={validationIssuesByField}
          onSetTavilyField={onSetTavilyField}
          onToolCallMaxRoundsChange={onToolCallMaxRoundsChange}
          onToolCallMaxRoundsBlur={onToolCallMaxRoundsBlur}
        />
      </div>
    </SearchTabLayout>
  );
};

export default SearchTab;


