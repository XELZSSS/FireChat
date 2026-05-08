import {
  getSearchIssues,
  SearchEngineCommonControls,
} from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/shared';
import type { SearchTabSharedProps } from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/types';

export const ExaEngineSection = ({
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
    <div className="grid grid-cols-2 items-end gap-3">
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


