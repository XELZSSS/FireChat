import { t } from '@/shared/utils/i18n';
import {
  getSearXNGSafeSearchOptions,
  getSearXNGTimeRangeOptions,
  SEARXNG_TIME_RANGE_ANY_VALUE,
} from '@client/features/settings/presentation/settingsModal/sections/optionFactories';
import {
  getSearchIssues,
  SearchDropdownControl,
  SearchNumericControl,
  SearchTextControl,
} from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/shared';
import type { SearchTabSharedProps } from '@client/features/settings/presentation/settingsModal/SearchTabEngineSections/types';

export const SearxngEngineSection = ({
  tavily,
  toolCallMaxRounds,
  validationIssuesByField,
  onSetTavilyField,
  onToolCallMaxRoundsChange,
  onToolCallMaxRoundsBlur,
}: SearchTabSharedProps) => {
  const toolCallRoundsIssues = getSearchIssues(validationIssuesByField, 'search.toolCallMaxRounds');

  return (
    <>
      <div className="grid grid-cols-3 items-end gap-3">
        <SearchDropdownControl
          label={t('settings.modal.search.searxng.safeSearch')}
          value={String(tavily.searxngSafeSearch ?? 1)}
          options={getSearXNGSafeSearchOptions()}
          onChange={(value) =>
            onSetTavilyField(
              'searxngSafeSearch',
              Number(value) as import('@/shared/types/chat').SearXNGSafeSearch
            )
          }
        />
        <SearchDropdownControl
          label={t('settings.modal.search.searxng.timeRange')}
          value={tavily.searxngTimeRange ?? SEARXNG_TIME_RANGE_ANY_VALUE}
          options={getSearXNGTimeRangeOptions()}
          onChange={(value) =>
            onSetTavilyField(
              'searxngTimeRange',
              (value === SEARXNG_TIME_RANGE_ANY_VALUE ? undefined : value) as
                | import('@/shared/types/chat').SearXNGTimeRange
                | undefined
            )
          }
        />
        <SearchNumericControl
          label={t('settings.modal.toolCallRounds')}
          value={toolCallMaxRounds}
          issues={toolCallRoundsIssues}
          onChange={onToolCallMaxRoundsChange}
          onBlur={onToolCallMaxRoundsBlur}
        />
      </div>
      <SearchTextControl
        label={t('settings.modal.search.searxng.language')}
        value={tavily.searxngLanguage ?? ''}
        placeholder={t('settings.modal.search.searxng.language.placeholder')}
        onChange={(value) => onSetTavilyField('searxngLanguage', value)}
      />
    </>
  );
};


