import { t } from '@/shared/utils/i18n';
import { PROVIDER_UI_META } from '@/infrastructure/providers/config/providerConfig';
import type { SettingsModalState } from '@client/features/settings/presentation/settingsModal/state/reducer';
import {
  parseHttpUrl,
  pushIssue,
} from '@client/features/settings/presentation/settingsModal/validation/validationHelpers';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validationTypes';
import type { ActiveSettingsTab } from '@client/features/settings/presentation/settingsModal/state/reducer';
import { resolveSettingsTabForProvider } from '@client/features/settings/presentation/settingsModal/sections/providerCatalog';

export const validateProviderTab = (
  state: SettingsModalState,
  issuesByTab: Record<ActiveSettingsTab, SettingsValidationIssue[]>,
  issuesByField: Record<string, SettingsValidationIssue[]>
): void => {
  const activeProviderMeta = PROVIDER_UI_META[state.provider.providerId];
  const providerTab = resolveSettingsTabForProvider(state.provider.providerId);

  if (activeProviderMeta?.supportsBaseUrl && state.provider.baseUrl?.trim()) {
    const parsedBaseUrl = parseHttpUrl(state.provider.baseUrl);

    if (!parsedBaseUrl) {
      pushIssue(issuesByTab, issuesByField, {
        severity: 'error',
        tab: providerTab,
        field: 'provider.baseUrl',
        message: t('settings.validation.provider.baseUrl.invalid'),
      });
    }
  }

  const duplicateHeaderRows = new Map<string, number[]>();
  const firstHeaderRowByKey = new Map<string, number>();

  state.provider.customHeaders.forEach((header, index) => {
    const key = header.key.trim();
    const value = header.value.trim();

    if ((key && !value) || (!key && value)) {
      pushIssue(issuesByTab, issuesByField, {
        severity: 'error',
        tab: providerTab,
        field: `provider.customHeaders.${index}`,
        message: `${t('settings.validation.provider.customHeaders.incomplete')} #${index + 1}`,
      });
    }

    if (!key) {
      return;
    }

    const normalizedKey = key.toLowerCase();
    const firstRow = firstHeaderRowByKey.get(normalizedKey);
    if (firstRow === undefined) {
      firstHeaderRowByKey.set(normalizedKey, index);
      return;
    }

    const rows = duplicateHeaderRows.get(normalizedKey) ?? [firstRow];
    rows.push(index);
    duplicateHeaderRows.set(normalizedKey, rows);
  });

  duplicateHeaderRows.forEach((rows) => {
    const label = state.provider.customHeaders[rows[0]]?.key.trim();
    rows.forEach((rowIndex) => {
      pushIssue(issuesByTab, issuesByField, {
        severity: 'error',
        tab: providerTab,
        field: `provider.customHeaders.${rowIndex}`,
        message: `${t('settings.validation.provider.customHeaders.duplicate')} ${label}`,
      });
    });
  });
};

