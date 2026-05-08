import { MAX_TOOL_CALL_ROUNDS, MIN_TOOL_CALL_ROUNDS } from '@/infrastructure/providers/utils';
import { t } from '@/shared/utils/i18n';
import { PROVIDER_UI_META } from '@/infrastructure/providers/config/providerConfig';
import type {
  ActiveSettingsTab,
  SettingsModalState,
} from '@client/features/settings/presentation/settingsModal/state/reducer';
import {
  parseHttpUrl,
  pushIssue,
} from '@client/features/settings/presentation/settingsModal/validation/validationHelpers';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validationTypes';

const isValidHostname = (value: string): boolean => /^[a-zA-Z0-9.-]+$/.test(value);
const isDigits = (value: string): boolean => /^\d+$/.test(value);

const validateLocalProxyConfig = (
  state: SettingsModalState,
  issuesByTab: Record<ActiveSettingsTab, SettingsValidationIssue[]>,
  issuesByField: Record<string, SettingsValidationIssue[]>
): void => {
  const localProxyHost = state.app.localProxyHost.trim();
  if (!localProxyHost) {
    pushIssue(issuesByTab, issuesByField, {
      severity: 'error',
      tab: 'options',
      field: 'version.localProxyHost',
      message: t('settings.validation.version.localProxyHost.missing'),
    });
  } else if (!isValidHostname(localProxyHost)) {
    pushIssue(issuesByTab, issuesByField, {
      severity: 'error',
      tab: 'options',
      field: 'version.localProxyHost',
      message: t('settings.validation.version.localProxyHost.invalid'),
    });
  }

  const localProxyPort = state.app.localProxyPort.trim();
  const parsedProxyPort = Number.parseInt(localProxyPort, 10);
  if (
    !localProxyPort ||
    !isDigits(localProxyPort) ||
    Number.isNaN(parsedProxyPort) ||
    parsedProxyPort < 0 ||
    parsedProxyPort > 65535
  ) {
    pushIssue(issuesByTab, issuesByField, {
      severity: 'error',
      tab: 'options',
      field: 'version.localProxyPort',
      message: t('settings.validation.version.localProxyPort.invalid'),
    });
  }
};

export const validateSearchTab = (
  state: SettingsModalState,
  issuesByTab: Record<ActiveSettingsTab, SettingsValidationIssue[]>,
  issuesByField: Record<string, SettingsValidationIssue[]>
): void => {
  const activeProviderMeta = PROVIDER_UI_META[state.provider.providerId];
  validateLocalProxyConfig(state, issuesByTab, issuesByField);

  if (!activeProviderMeta?.supportsTavily) {
    return;
  }

  const toolCallRounds = state.app.toolCallMaxRounds.trim();
  if (toolCallRounds) {
    const parsed = Number.parseInt(toolCallRounds, 10);
    if (
      !isDigits(toolCallRounds) ||
      Number.isNaN(parsed) ||
      parsed < MIN_TOOL_CALL_ROUNDS ||
      parsed > MAX_TOOL_CALL_ROUNDS
    ) {
      pushIssue(issuesByTab, issuesByField, {
        severity: 'error',
        tab: 'search',
        field: 'search.toolCallMaxRounds',
        message: `${t('settings.validation.search.toolCallRounds.invalid')} ${MIN_TOOL_CALL_ROUNDS}-${MAX_TOOL_CALL_ROUNDS}`,
      });
    }
  }

  if (state.provider.tavily.maxResults !== undefined) {
    const maxResults = state.provider.tavily.maxResults;
    if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 20) {
      pushIssue(issuesByTab, issuesByField, {
        severity: 'error',
        tab: 'search',
        field: 'search.maxResults',
        message: t('settings.validation.search.maxResults.invalid'),
      });
    }
  }

  const engine =
    state.provider.tavily.engine === 'exa' ||
    state.provider.tavily.engine === 'searxng' ||
    state.provider.tavily.engine === 'firecrawl'
      ? state.provider.tavily.engine
      : 'tavily';

  if (engine === 'searxng') {
    if (!state.provider.tavily.searxngBaseUrl?.trim()) {
      pushIssue(issuesByTab, issuesByField, {
        severity: 'warning',
        tab: 'search',
        field: 'search.searxngBaseUrl',
        message: t('settings.validation.search.searxng.baseUrl.missing'),
      });
      return;
    }

    if (!parseHttpUrl(state.provider.tavily.searxngBaseUrl)) {
      pushIssue(issuesByTab, issuesByField, {
        severity: 'error',
        tab: 'search',
        field: 'search.searxngBaseUrl',
        message: t('settings.validation.search.searxng.baseUrl.invalid'),
      });
    }

    return;
  }

  if (engine === 'firecrawl') {
    const country = state.provider.tavily.firecrawlCountry?.trim();
    if (country && !/^[a-z]{2}$/i.test(country)) {
      pushIssue(issuesByTab, issuesByField, {
        severity: 'error',
        tab: 'search',
        field: 'search.firecrawlCountry',
        message: t('settings.validation.search.firecrawl.country.invalid'),
      });
    }
  }

  if (engine === 'exa') {
    return;
  }

  if (!state.provider.tavily.apiKey?.trim()) {
    pushIssue(issuesByTab, issuesByField, {
      severity: 'warning',
      tab: 'search',
      field: 'search.apiKey',
      message:
        engine === 'firecrawl'
          ? t('settings.validation.search.firecrawl.apiKey.missing')
          : t('settings.validation.search.tavily.apiKey.missing'),
    });
  }
};

