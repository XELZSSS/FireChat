import { useCallback, useEffect, useState } from 'react';
import { Button, Dropdown, Field, Input } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import {
  composeSettingsInputClassName,
  hasSettingsValidationError,
  SettingsCard,
  SettingsControlGroup,
  SettingsFieldMessages,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import { fullInputClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import { getDesktopLocalProxyConfig } from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import type { OptionsTabProps } from '@client/features/settings/presentation/settingsModal/optionsTab/types';
import { buildHttpProtocolOptions } from '@client/features/settings/presentation/settingsModal/optionsTab/optionFactories';

type LocalProxySettingsCardProps = Pick<
  OptionsTabProps,
  | 'httpProtocol'
  | 'localProxyHost'
  | 'localProxyPort'
  | 'mutationsLockedReason'
  | 'validationIssuesByField'
  | 'onHttpProtocolChange'
  | 'onLocalProxyHostChange'
  | 'onLocalProxyPortChange'
>;

const LocalProxySettingsCard = ({
  httpProtocol,
  localProxyHost,
  localProxyPort,
  mutationsLockedReason,
  validationIssuesByField,
  onHttpProtocolChange,
  onLocalProxyHostChange,
  onLocalProxyPortChange,
}: LocalProxySettingsCardProps) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [statusText, setStatusText] = useState('');
  const interactionLockTitle = mutationsLockedReason ?? undefined;
  const localProxyHostIssues = validationIssuesByField['version.localProxyHost'];
  const localProxyPortIssues = validationIssuesByField['version.localProxyPort'];

  const refreshProxyStatus = useCallback(async () => {
    try {
      const config = await getDesktopLocalProxyConfig();
      setBaseUrl(config.baseUrl ?? '');
      setStatusText('');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    let active = true;

    void getDesktopLocalProxyConfig()
      .then((config) => {
        if (!active) return;
        setBaseUrl(config.baseUrl ?? '');
        setStatusText('');
      })
      .catch((error) => {
        if (!active) return;
        setStatusText(error instanceof Error ? error.message : String(error));
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCopyProxyUrl = useCallback(() => {
    if (!baseUrl) {
      return;
    }

    void navigator.clipboard
      .writeText(baseUrl)
      .then(() => {
        setStatusText(t('settings.localProxy.copied'));
      })
      .catch((error) => {
        setStatusText(error instanceof Error ? error.message : String(error));
      });
  }, [baseUrl]);

  const handleLocalProxyHostBlur = useCallback(
    () => onLocalProxyHostChange(localProxyHost.trim()),
    [localProxyHost, onLocalProxyHostChange]
  );
  const handleLocalProxyPortChange = useCallback(
    (value: string) => onLocalProxyPortChange(value.replace(/[^\d]/g, '')),
    [onLocalProxyPortChange]
  );
  const handleLocalProxyPortBlur = useCallback(() => {
    const normalizedPort = localProxyPort.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
    onLocalProxyPortChange(normalizedPort || '0');
  }, [localProxyPort, onLocalProxyPortChange]);

  return (
    <Field label={t('settings.localProxy.title')}>
      <SettingsCard className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <SettingsControlGroup label={t('settings.options.httpProtocol.label')}>
            <Dropdown
              value={httpProtocol}
              options={buildHttpProtocolOptions()}
              onChange={(value) => onHttpProtocolChange(value as OptionsTabProps['httpProtocol'])}
              widthClassName="w-full"
              disabled={!!mutationsLockedReason}
            />
          </SettingsControlGroup>
          <SettingsControlGroup label={t('settings.localProxy.host')}>
            <div className="space-y-2">
              <Input
                type="text"
                value={localProxyHost}
                onChange={(event) => onLocalProxyHostChange(event.target.value)}
                onBlur={handleLocalProxyHostBlur}
                className={composeSettingsInputClassName(fullInputClass, localProxyHostIssues)}
                compact
                autoComplete="off"
                spellCheck={false}
                aria-invalid={hasSettingsValidationError(localProxyHostIssues) || undefined}
                placeholder="127.0.0.1"
                disabled={!!mutationsLockedReason}
                title={interactionLockTitle}
              />
              <SettingsFieldMessages issues={localProxyHostIssues} />
            </div>
          </SettingsControlGroup>

          <SettingsControlGroup label={t('settings.localProxy.port')}>
            <div className="space-y-2">
              <Input
                type="text"
                inputMode="numeric"
                value={localProxyPort}
                onChange={(event) => handleLocalProxyPortChange(event.target.value)}
                onBlur={handleLocalProxyPortBlur}
                className={composeSettingsInputClassName(fullInputClass, localProxyPortIssues)}
                compact
                autoComplete="off"
                spellCheck={false}
                aria-invalid={hasSettingsValidationError(localProxyPortIssues) || undefined}
                placeholder="0"
                disabled={!!mutationsLockedReason}
                title={interactionLockTitle}
              />
              <SettingsFieldMessages issues={localProxyPortIssues} />
            </div>
          </SettingsControlGroup>
        </div>

        {baseUrl ? (
          <div className="border border-[var(--line-1)] bg-[var(--bg-1)] px-3 py-2 font-mono text-xs text-[var(--ink-2)]">
            {baseUrl}
          </div>
        ) : null}

        {statusText ? <div className="text-xs text-[var(--ink-3)]">{statusText}</div> : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refreshProxyStatus}>
            {t('settings.localProxy.refresh')}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyProxyUrl} disabled={!baseUrl}>
            {t('settings.localProxy.copy')}
          </Button>
        </div>
      </SettingsCard>
    </Field>
  );
};

export default LocalProxySettingsCard;
