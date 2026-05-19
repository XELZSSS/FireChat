import { Button, Dropdown, Field, Input, type DropdownOption } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import type { RequestLogStatus } from '@contracts/request-log';
import {
  SettingsCard,
  SettingsControlGroup,
  SettingsHint,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import { fullInputClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import type { RequestLogStatusFilter } from '@client/features/settings/presentation/settingsModal/requestLogsTab/types';

type RequestLogFiltersProps = {
  providerFilter: string;
  statusFilter: RequestLogStatusFilter;
  keyword: string;
  providerOptions: DropdownOption[];
  resultFilterOptions: DropdownOption[];
  isLoading: boolean;
  canClear: boolean;
  total: number;
  errorMessage: string | null;
  mutationsLockedReason: string | null;
  onProviderFilterChange: (value: string) => void;
  onStatusFilterChange: (value: 'all' | RequestLogStatus) => void;
  onKeywordChange: (value: string) => void;
  onRefresh: () => void;
  onClear: () => void;
};

const RequestLogFilters = ({
  providerFilter,
  statusFilter,
  keyword,
  providerOptions,
  resultFilterOptions,
  isLoading,
  canClear,
  total,
  errorMessage,
  mutationsLockedReason,
  onProviderFilterChange,
  onStatusFilterChange,
  onKeywordChange,
  onRefresh,
  onClear,
}: RequestLogFiltersProps) => (
  <Field label={t('settings.requestLogs.title')}>
    <SettingsCard className="space-y-3">
      <SettingsHint>{t('settings.requestLogs.description')}</SettingsHint>
      <div className="grid gap-3 grid-cols-3">
        <SettingsControlGroup label={t('settings.requestLogs.provider')}>
          <Dropdown
            value={providerFilter}
            options={providerOptions}
            onChange={onProviderFilterChange}
            widthClassName="w-full"
          />
        </SettingsControlGroup>
        <SettingsControlGroup label={t('settings.requestLogs.status')}>
          <Dropdown
            value={statusFilter}
            options={resultFilterOptions}
            onChange={(value) => onStatusFilterChange(value as RequestLogStatusFilter)}
            widthClassName="w-full"
          />
        </SettingsControlGroup>
        <SettingsControlGroup label={t('settings.requestLogs.keyword')}>
          <Input
            type="text"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            className={fullInputClass}
            compact
            autoComplete="off"
            spellCheck={false}
            placeholder={t('settings.requestLogs.keywordPlaceholder')}
          />
        </SettingsControlGroup>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onRefresh} variant="ghost" size="sm" disabled={isLoading}>
          {t('settings.requestLogs.refresh')}
        </Button>
        <Button
          onClick={onClear}
          variant="ghost"
          size="sm"
          disabled={!canClear || !!mutationsLockedReason}
          title={mutationsLockedReason ?? undefined}
        >
          {t('settings.requestLogs.clear')}
        </Button>
        <div className="text-[11px] leading-5 text-[var(--ink-3)]">
          {t('settings.requestLogs.total').replace('{count}', String(total))}
        </div>
      </div>
      {errorMessage ? (
        <div className="border border-[var(--status-error)] bg-[var(--bg-2)] px-3 py-2 text-[11px] leading-5 text-[var(--status-error)]">
          {errorMessage}
        </div>
      ) : null}
    </SettingsCard>
  </Field>
);

export default RequestLogFilters;
