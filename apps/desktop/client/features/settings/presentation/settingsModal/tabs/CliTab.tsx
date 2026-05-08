import { useEffect, useState } from 'react';
import type {
  CliProviderKey,
  CliProviderRuntimeStatus,
  CliProviderStatusMap,
  CliSettings,
} from '@contracts/desktop';
import { t } from '@/shared/utils/i18n';
import { Field, Input, Toggle } from '@/shared/ui';
import {
  getDesktopCliProviderStatus,
  isDesktopEnvironment,
  syncDesktopCliProviderConfig,
} from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import { normalizeCliSettings } from '@/infrastructure/providers/cliProviderSettings';
import { updateAppSettings } from '@/infrastructure/persistence/appSettingsStore';
import { fullInputClass } from '@client/features/settings/presentation/settingsModal/sections/styles';

type CliProviderCardDefinition = {
  key: CliProviderKey;
  title: string;
  description: string;
  defaultCommand: string;
};

type CliTabProps = {
  cli: CliSettings;
  mutationsLockedReason?: string | null;
  onCliSettingsChange: (value: CliSettings) => void;
};

const CLI_PROVIDER_CARDS: CliProviderCardDefinition[] = [
  {
    key: 'codex',
    title: 'Codex CLI',
    description: t('settings.cli.codex.description'),
    defaultCommand: 'codex',
  },
  {
    key: 'claudeCode',
    title: 'Claude Code CLI',
    description: t('settings.cli.claude.description'),
    defaultCommand: 'claude',
  },
];

const createLocalStatus = (
  cli: CliSettings,
  key: CliProviderKey,
  message: string
): CliProviderRuntimeStatus => ({
  enabled: cli[key].enabled,
  running: false,
  connected: false,
  status: 'error',
  message,
});

const getStatusText = (
  canUseDesktop: boolean,
  status: CliProviderRuntimeStatus | undefined
): string => {
  if (!canUseDesktop) {
    return t('settings.cli.status.desktopOnly');
  }
  if (!status) {
    return t('settings.cli.status.stopped');
  }
  if (status.message) {
    return status.message;
  }
  return t(`settings.cli.status.${status.status}`);
};

const CliTab = ({
  cli,
  mutationsLockedReason,
  onCliSettingsChange,
}: CliTabProps) => {
  const canUseDesktop = isDesktopEnvironment();
  const [status, setStatus] = useState<CliProviderStatusMap | null>(null);
  const [busyKey, setBusyKey] = useState<CliProviderKey | null>(null);
  const locked = Boolean(mutationsLockedReason);

  useEffect(() => {
    if (!canUseDesktop) {
      return;
    }

    let active = true;
    void getDesktopCliProviderStatus()
      .then((nextStatus) => {
        if (active) {
          setStatus(nextStatus);
        }
      })
      .catch((error) => {
        console.error('Failed to load CLI provider status:', error);
      });

    return () => {
      active = false;
    };
  }, [canUseDesktop]);

  const syncRuntime = async (nextSettings: CliSettings, key: CliProviderKey) => {
    if (!canUseDesktop) {
      return;
    }

    setBusyKey(key);
    try {
      const nextStatus = await syncDesktopCliProviderConfig(nextSettings);
      setStatus(nextStatus);
    } catch (error) {
      setStatus((current) => ({
        codex: current?.codex ?? createLocalStatus(nextSettings, 'codex', ''),
        claudeCode: current?.claudeCode ?? createLocalStatus(nextSettings, 'claudeCode', ''),
        [key]: createLocalStatus(
          nextSettings,
          key,
          error instanceof Error ? error.message : String(error)
        ),
      }));
    } finally {
      setBusyKey(null);
    }
  };

  const patchCli = (
    key: CliProviderKey,
    updates: Partial<CliSettings[CliProviderKey]>,
    sync: boolean
  ) => {
    const isEnabling = updates.enabled === true;
    const otherKey: CliProviderKey = key === 'codex' ? 'claudeCode' : 'codex';
    const nextSettings = normalizeCliSettings(
      {
        ...cli,
        ...(isEnabling
          ? {
              [otherKey]: {
                ...cli[otherKey],
                enabled: false,
              },
            }
          : {}),
        [key]: {
          ...cli[key],
          ...updates,
        },
      },
      cli
    );
    onCliSettingsChange(nextSettings);
    updateAppSettings({ cli: nextSettings });
    if (sync) {
      void syncRuntime(nextSettings, key);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-[var(--line-1)] bg-[var(--bg-2)]/60 px-3 py-3">
        <div className="space-y-1">
          <div className="text-sm font-medium text-[var(--ink-1)]">
            {t('settings.cli.title')}
          </div>
          <div className="text-xs leading-5 text-[var(--ink-3)]">
            {t('settings.cli.description')}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {CLI_PROVIDER_CARDS.map((card) => {
          const connection = cli[card.key];
          const providerStatus = status?.[card.key];
          const isBusy = busyKey === card.key;

          return (
            <div
              key={card.key}
              className="space-y-3 border border-[var(--line-1)] bg-[var(--bg-2)]/40 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-[var(--ink-1)]">{card.title}</div>
                  <div className="text-xs leading-5 text-[var(--ink-3)]">{card.description}</div>
                </div>
                <Toggle
                  checked={connection.enabled}
                  onCheckedChange={(enabled) => patchCli(card.key, { enabled }, true)}
                  disabled={!canUseDesktop || locked || isBusy}
                />
              </div>

              <div className="text-xs leading-5 text-[var(--ink-2)]">
                {getStatusText(canUseDesktop, providerStatus)}
              </div>

              <Field label={t('settings.cli.command')}>
                <Input
                  type="text"
                  value={connection.command}
                  onChange={(event) =>
                    patchCli(card.key, { command: event.target.value || card.defaultCommand }, false)
                  }
                  onBlur={(event) => {
                    const nextSettings = normalizeCliSettings(
                      {
                        ...cli,
                        [card.key]: {
                          ...connection,
                          command: event.currentTarget.value || card.defaultCommand,
                        },
                      },
                      cli
                    );
                    if (nextSettings[card.key].enabled) {
                      void syncRuntime(nextSettings, card.key);
                    }
                  }}
                  className={fullInputClass}
                  compact
                  autoComplete="off"
                  disabled={locked || isBusy}
                />
              </Field>

              <Field label={t('settings.cli.workingDirectory')}>
                <Input
                  type="text"
                  value={connection.workingDirectory}
                  onChange={(event) =>
                    patchCli(card.key, { workingDirectory: event.target.value }, false)
                  }
                  onBlur={(event) => {
                    const nextSettings = normalizeCliSettings(
                      {
                        ...cli,
                        [card.key]: {
                          ...connection,
                          workingDirectory: event.currentTarget.value,
                        },
                      },
                      cli
                    );
                    if (nextSettings[card.key].enabled) {
                      void syncRuntime(nextSettings, card.key);
                    }
                  }}
                  placeholder={t('settings.cli.workingDirectory.placeholder')}
                  className={fullInputClass}
                  compact
                  autoComplete="off"
                  disabled={locked || isBusy}
                />
              </Field>

              <div className="text-xs leading-5 text-[var(--ink-2)]">
                {connection.enabled
                  ? t('settings.cli.activeChat')
                  : t('settings.cli.inactiveChat')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CliTab;

