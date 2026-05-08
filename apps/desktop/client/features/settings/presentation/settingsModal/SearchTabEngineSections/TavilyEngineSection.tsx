import { t } from '@/shared/utils/i18n';
import { getTavilySearchDepthOptions } from '@client/features/settings/presentation/settingsModal/sections/optionFactories';
import {
  getSearchIssues,
  SearchDropdownControl,
  SearchEngineCommonControls,
} from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/shared';
import type { SearchTabSharedProps } from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/types';

export const TavilyEngineSection = ({
  tavily,
  toolCallMaxRounds,
  validationIssuesByField,
  onSetTavilyField,
  onToolCallMaxRoundsChange,
  onToolCallMaxRoundsBlur,
}: SearchTabSharedProps) => {
  const toolCallRoundsIssues = getSearchIssues(validationIssuesByField, 'search.toolCallMaxRounds');
  const maxResultsIssues = getSearchIssues(validationIssuesByField, 'search.maxResults');

  return (
    <div className="grid grid-cols-3 items-end gap-3">
      <SearchDropdownControl
        label={t('settings.modal.tavily.searchDepth')}
        value={tavily.searchDepth ?? 'basic'}
        options={getTavilySearchDepthOptions()}
        onChange={(value) =>
          onSetTavilyField('searchDepth', value as import('@/shared/types/chat').TavilySearchDepth)
        }
      />
      <SearchEngineCommonControls
        toolCallMaxRounds={toolCallMaxRounds}
        maxResults={tavily.maxResults}
        toolCallRoundsIssues={toolCallRoundsIssues}
        maxResultsIssues={maxResultsIssues}
        onToolCallMaxRoundsChange={onToolCallMaxRoundsChange}
        onToolCallMaxRoundsBlur={onToolCallMaxRoundsBlur}
        onSetMaxResults={(value) => onSetTavilyField('maxResults', value)}
      />
    </div>
  );
};


