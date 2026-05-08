import type { ReactNode } from 'react';
import { TavilyConfig, type SearchEngine } from '@/shared/types/chat';
import { t } from '@/shared/utils/i18n';
import { getSearchEngineOptions } from '@client/features/settings/presentation/settingsModal/sections/optionFactories';
import { fullInputClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import { Dropdown, Field, Input } from '@/shared/ui';
import SecretInput from '@client/features/settings/presentation/settingsModal/sections/SecretInput';
import {
  composeSettingsInputClassName,
  hasSettingsValidationError,
  SettingsControlGroup,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';

type SearchTabSharedProps = {
  tavily: TavilyConfig;
  toolCallMaxRounds: string;
  validationIssuesByField: Record<string, SettingsValidationIssue[]>;
  onSetTavilyField: <K extends keyof TavilyConfig>(key: K, value: TavilyConfig[K]) => void;
  onToolCallMaxRoundsChange: (value: string) => void;
  onToolCallMaxRoundsBlur: () => void;
};

type SearchEngineSectionProps = Pick<
  SearchTabSharedProps,
  'tavily' | 'validationIssuesByField' | 'onSetTavilyField'
> & {
  activeEngine: 'tavily' | 'exa' | 'searxng' | 'firecrawl';
  showTavilyKey: boolean;
  tavilyKeyLabel: string;
  apiKeyLabel: string;
  onToggleTavilyKeyVisibility: () => void;
};

const SearxngBaseUrlField = ({
  value,
  issues,
  onChange,
}: {
  value?: string;
  issues?: SettingsValidationIssue[];
  onChange: (value: string) => void;
}) => {
  return (
    <SettingsControlGroup label={t('settings.modal.search.searxng.baseUrl')}>
      <div className="space-y-2">
        <Input
          type="text"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          className={composeSettingsInputClassName(fullInputClass, issues)}
          compact
          autoComplete="off"
          placeholder={t('settings.modal.search.searxng.baseUrl.placeholder')}
          aria-invalid={hasSettingsValidationError(issues) || undefined}
        />
      </div>
    </SettingsControlGroup>
  );
};

export const SearchTabLayout = ({ children }: { children: ReactNode }) => (
  <div className="space-y-4">
    <Field label={null}>
      <div className="space-y-5">{children}</div>
    </Field>
  </div>
);

export const SearchEngineSection = ({
  tavily,
  activeEngine,
  showTavilyKey,
  validationIssuesByField,
  tavilyKeyLabel,
  apiKeyLabel,
  onSetTavilyField,
  onToggleTavilyKeyVisibility,
}: SearchEngineSectionProps) => {
  const apiKeyIssues = validationIssuesByField['search.apiKey'];
  const searxngBaseUrlIssues = validationIssuesByField['search.searxngBaseUrl'];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <SettingsControlGroup label={t('settings.modal.search.engine')}>
        <Dropdown
          value={activeEngine}
          options={getSearchEngineOptions()}
          onChange={(value) => onSetTavilyField('engine', value as SearchEngine)}
          widthClassName="w-full"
        />
      </SettingsControlGroup>

      {activeEngine !== 'searxng' ? (
        <SecretInput
          label={apiKeyLabel}
          labelClassName="text-xs text-[var(--ink-3)]"
          value={tavily.apiKey ?? ''}
          onChange={(event) => onSetTavilyField('apiKey', event.target.value)}
          showSecret={showTavilyKey}
          onToggleVisibility={onToggleTavilyKeyVisibility}
          onClear={() => onSetTavilyField('apiKey', '')}
          visibilityLabel={tavilyKeyLabel}
          inputClassName={`${fullInputClass} pr-20`}
          compact
          issues={apiKeyIssues}
          showIssues={false}
        />
      ) : (
        <SearxngBaseUrlField
          value={tavily.searxngBaseUrl}
          issues={searxngBaseUrlIssues}
          onChange={(value) => onSetTavilyField('searxngBaseUrl', value)}
        />
      )}
    </div>
  );
};

