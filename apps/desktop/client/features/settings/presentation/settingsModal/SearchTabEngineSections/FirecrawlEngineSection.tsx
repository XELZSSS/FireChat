import { t } from '@/shared/utils/i18n';
import {
  getSearchIssues,
  SearchEngineCommonControls,
  SearchTextControl,
  SearchToggleControl,
} from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/shared';
import type { SearchTabSharedProps } from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/types';

export const FirecrawlEngineSection = ({
  tavily,
  toolCallMaxRounds,
  validationIssuesByField,
  onSetTavilyField,
  onToolCallMaxRoundsChange,
  onToolCallMaxRoundsBlur,
}: SearchTabSharedProps) => {
  const toolCallRoundsIssues = getSearchIssues(validationIssuesByField, 'search.toolCallMaxRounds');
  const maxResultsIssues = getSearchIssues(validationIssuesByField, 'search.maxResults');
  const countryIssues = getSearchIssues(validationIssuesByField, 'search.firecrawlCountry');

  return (
    <>
      <div className="grid grid-cols-4 items-end gap-3">
        <SearchEngineCommonControls
          toolCallMaxRounds={toolCallMaxRounds}
          maxResults={tavily.maxResults}
          toolCallRoundsIssues={toolCallRoundsIssues}
          maxResultsIssues={maxResultsIssues}
          onToolCallMaxRoundsChange={onToolCallMaxRoundsChange}
          onToolCallMaxRoundsBlur={onToolCallMaxRoundsBlur}
          onSetMaxResults={(value) => onSetTavilyField('maxResults', value)}
        />
        <SearchTextControl
          label={t('settings.modal.search.firecrawl.country')}
          value={tavily.firecrawlCountry ?? ''}
          placeholder={t('settings.modal.search.firecrawl.country.placeholder')}
          issues={countryIssues}
          onChange={(value) => onSetTavilyField('firecrawlCountry', value)}
        />
        <SearchToggleControl
          checked={tavily.firecrawlScrapeContent ?? false}
          label={t('settings.modal.search.firecrawl.scrapeContent')}
          onCheckedChange={(checked) => onSetTavilyField('firecrawlScrapeContent', checked)}
        />
      </div>
      <SearchTextControl
        label={t('settings.modal.search.firecrawl.location')}
        value={tavily.firecrawlLocation ?? ''}
        placeholder={t('settings.modal.search.firecrawl.location.placeholder')}
        onChange={(value) => onSetTavilyField('firecrawlLocation', value)}
      />
    </>
  );
};


