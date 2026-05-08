import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Field, Input } from '@/shared/ui';
import { t } from '@/shared/utils/i18n';
import {
  AI_GATEWAY_DEFINITIONS,
  buildAiGatewayModelsUrl,
  getAiGatewayDefinition,
  getAiGatewayRequestConfig,
  isAiGatewayId,
  normalizeAiGatewayBaseUrl,
  type AiGatewaySettings,
} from '@/infrastructure/providers/aiGatewaySettings';
import { providerHttpFetch } from '@/infrastructure/network/proxyFetch';
import {
  composeSettingsInputClassName,
  hasSettingsValidationError,
  SettingsCard,
  SettingsControlGroup,
  SettingsFieldMessages,
  SettingsHint,
  SettingsToggleRow,
} from '@client/features/settings/presentation/settingsModal/sections/formParts';
import { fullInputClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';

type AiGatewayTabProps = {
  aiGateway: AiGatewaySettings;
  mutationsLockedReason?: string | null;
  validationIssuesByField: Record<string, SettingsValidationIssue[]>;
  onAiGatewayChange: (value: AiGatewaySettings) => void;
};

type GatewayStatus = 'disabled' | 'invalid' | 'checking' | 'connected' | 'auth' | 'failed';

const CHECK_TIMEOUT_MS = 3000;
const AUTO_CHECK_DELAY_MS = 400;

const gatewayOptions = AI_GATEWAY_DEFINITIONS.map((definition) => ({
  value: definition.id,
  label: definition.label,
  iconSrc: definition.iconSrc,
}));

const getStatusLabel = (status: GatewayStatus): string => {
  switch (status) {
    case 'checking':
      return t('settings.aiGateway.status.checking');
    case 'connected':
      return t('settings.aiGateway.status.connected');
    case 'auth':
      return t('settings.aiGateway.status.auth');
    case 'failed':
      return t('settings.aiGateway.status.failed');
    case 'invalid':
      return t('settings.aiGateway.status.invalid');
    default:
      return t('settings.aiGateway.status.disabled');
  }
};

const probeGateway = async (settings: AiGatewaySettings): Promise<GatewayStatus> => {
  const requestConfig = getAiGatewayRequestConfig(settings);
  if (!requestConfig) {
    return settings.enabled ? 'invalid' : 'disabled';
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {};
    if (requestConfig.apiKey) {
      headers.Authorization = `Bearer ${requestConfig.apiKey}`;
    }

    const response = await providerHttpFetch(buildAiGatewayModelsUrl(requestConfig.baseUrl), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      return 'auth';
    }

    return response.status < 500 ? 'connected' : 'failed';
  } catch {
    return 'failed';
  } finally {
    window.clearTimeout(timeout);
  }
};

const AiGatewayTab = ({
  aiGateway,
  mutationsLockedReason = null,
  validationIssuesByField,
  onAiGatewayChange,
}: AiGatewayTabProps) => {
  const [status, setStatus] = useState<GatewayStatus>('disabled');
  const statusRequestIdRef = useRef(0);
  const baseUrlIssues = validationIssuesByField['aiGateway.baseUrl'];
  const interactionLockTitle = mutationsLockedReason ?? undefined;
  const selectedGateway = useMemo(
    () => getAiGatewayDefinition(aiGateway.gatewayId),
    [aiGateway.gatewayId]
  );

  const patchAiGateway = useCallback(
    (updates: Partial<AiGatewaySettings>) => {
      onAiGatewayChange({
        ...aiGateway,
        ...updates,
      });
    },
    [aiGateway, onAiGatewayChange]
  );

  const handleGatewayChange = useCallback(
    (value: string) => {
      if (!isAiGatewayId(value)) {
        return;
      }

      const definition = getAiGatewayDefinition(value);
      patchAiGateway({
        gatewayId: value,
        baseUrl: definition.defaultBaseUrl,
      });
    },
    [patchAiGateway]
  );

  const refreshStatus = useCallback(() => {
    const requestId = statusRequestIdRef.current + 1;
    statusRequestIdRef.current = requestId;

    if (!aiGateway.enabled) {
      setStatus('disabled');
      return;
    }

    setStatus('checking');
    void probeGateway(aiGateway).then((nextStatus) => {
      if (statusRequestIdRef.current === requestId) {
        setStatus(nextStatus);
      }
    });
  }, [aiGateway]);

  useEffect(() => {
    const timer = window.setTimeout(refreshStatus, AUTO_CHECK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [refreshStatus]);

  return (
    <div className="space-y-5">
      <Field label={t('settings.aiGateway.title')}>
        <SettingsCard className="space-y-4">
          <SettingsToggleRow
            checked={aiGateway.enabled}
            title={t('settings.aiGateway.enabled')}
            description={t('settings.aiGateway.enabled.help')}
            disabled={!!mutationsLockedReason}
            onCheckedChange={(checked) => patchAiGateway({ enabled: checked })}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <SettingsControlGroup label={t('settings.aiGateway.provider')}>
              <Dropdown
                value={aiGateway.gatewayId}
                options={gatewayOptions}
                onChange={handleGatewayChange}
                widthClassName="w-full"
                disabled={!!mutationsLockedReason}
              />
            </SettingsControlGroup>

            <SettingsControlGroup label={t('settings.aiGateway.status')}>
              <div className="flex h-9 items-center border border-[var(--line-1)] bg-[var(--bg-2)] px-3 text-sm text-[var(--ink-2)]">
                {getStatusLabel(status)}
              </div>
            </SettingsControlGroup>
          </div>

          <SettingsControlGroup label={t('settings.aiGateway.baseUrl')}>
            <div className="space-y-2">
              <Input
                type="text"
                value={aiGateway.baseUrl}
                onChange={(event) => patchAiGateway({ baseUrl: event.target.value })}
                onBlur={(event) =>
                  patchAiGateway({ baseUrl: normalizeAiGatewayBaseUrl(event.currentTarget.value) })
                }
                className={composeSettingsInputClassName(fullInputClass, baseUrlIssues)}
                compact
                autoComplete="off"
                spellCheck={false}
                aria-invalid={hasSettingsValidationError(baseUrlIssues) || undefined}
                placeholder={selectedGateway.defaultBaseUrl}
                disabled={!!mutationsLockedReason}
                title={interactionLockTitle}
              />
              <SettingsFieldMessages issues={baseUrlIssues} />
            </div>
          </SettingsControlGroup>

          <SettingsControlGroup label={t('settings.aiGateway.apiKey')}>
            <Input
              type="password"
              value={aiGateway.apiKey}
              onChange={(event) => patchAiGateway({ apiKey: event.target.value })}
              className={fullInputClass}
              compact
              autoComplete="off"
              spellCheck={false}
              disabled={!!mutationsLockedReason}
              title={interactionLockTitle}
            />
          </SettingsControlGroup>

          <SettingsHint>{t('settings.aiGateway.help')}</SettingsHint>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshStatus}
              disabled={!aiGateway.enabled || !!mutationsLockedReason}
              title={interactionLockTitle}
            >
              {t('settings.aiGateway.check')}
            </Button>
            <div className="text-xs text-[var(--ink-3)]">{selectedGateway.defaultBaseUrl}</div>
          </div>
        </SettingsCard>
      </Field>
    </div>
  );
};

export default AiGatewayTab;

