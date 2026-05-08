import { t } from '@/shared/utils/i18n';
import type { DropdownOption } from '@/shared/ui';

export const SEARXNG_TIME_RANGE_ANY_VALUE = '__any__';

const buildOptions = (items: Array<[string, string]>): DropdownOption[] =>
  items.map(([value, labelKey]) => ({ value, label: t(labelKey) }));

export const getTavilySearchDepthOptions = (): DropdownOption[] =>
  buildOptions([
    ['basic', 'settings.modal.tavily.searchDepth.basic'],
    ['advanced', 'settings.modal.tavily.searchDepth.advanced'],
    ['fast', 'settings.modal.tavily.searchDepth.fast'],
    ['ultra-fast', 'settings.modal.tavily.searchDepth.ultraFast'],
  ]);

export const getSearchEngineOptions = (): DropdownOption[] =>
  buildOptions([
    ['exa', 'settings.modal.search.engine.exa'],
    ['tavily', 'settings.modal.search.engine.tavily'],
    ['searxng', 'settings.modal.search.engine.searxng'],
    ['firecrawl', 'settings.modal.search.engine.firecrawl'],
  ]);

export const getSearXNGTimeRangeOptions = (): DropdownOption[] =>
  buildOptions([
    [SEARXNG_TIME_RANGE_ANY_VALUE, 'settings.modal.search.searxng.timeRange.any'],
    ['day', 'settings.modal.search.searxng.timeRange.day'],
    ['month', 'settings.modal.search.searxng.timeRange.month'],
    ['year', 'settings.modal.search.searxng.timeRange.year'],
  ]);

export const getSearXNGSafeSearchOptions = (): DropdownOption[] =>
  buildOptions([
    ['0', 'settings.modal.search.searxng.safeSearch.off'],
    ['1', 'settings.modal.search.searxng.safeSearch.moderate'],
    ['2', 'settings.modal.search.searxng.safeSearch.strict'],
  ]);
