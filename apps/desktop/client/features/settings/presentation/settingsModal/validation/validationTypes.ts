import type { ActiveSettingsTab } from '@client/features/settings/presentation/settingsModal/state/reducer';

export type SettingsValidationSeverity = 'error' | 'warning';

export type SettingsValidationField =
  | 'provider.baseUrl'
  | `provider.customHeaders.${number}`
  | 'search.apiKey'
  | 'search.searxngBaseUrl'
  | 'search.firecrawlCountry'
  | 'search.toolCallMaxRounds'
  | 'search.maxResults'
  | 'options.interfaceLayoutConfig'
  | 'version.localProxyHost'
  | 'version.localProxyPort';

export type SettingsValidationIssue = {
  severity: SettingsValidationSeverity;
  tab: ActiveSettingsTab;
  field?: SettingsValidationField;
  message: string;
};

export type SettingsValidationResult = {
  issues: SettingsValidationIssue[];
  errors: SettingsValidationIssue[];
  warnings: SettingsValidationIssue[];
  issuesByTab: Record<ActiveSettingsTab, SettingsValidationIssue[]>;
  issuesByField: Record<string, SettingsValidationIssue[]>;
};

