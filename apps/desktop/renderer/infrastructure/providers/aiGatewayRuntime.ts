import { loadAppSettings } from '@/infrastructure/persistence/appSettingsStore';
import {
  type AiGatewayCallRequestConfig,
  getAiGatewayRequestConfig,
  type AiGatewayRequestConfig,
} from '@/infrastructure/providers/aiGatewaySettings';

const GATEWAY_INVALID_BASE_URL_ERROR = 'Gateway API URL is invalid.';

export const resolveActiveAiGatewayRequestConfig = (): AiGatewayRequestConfig | undefined =>
  getAiGatewayRequestConfig(loadAppSettings().aiGateway);

export const resolveActiveAiGatewayCallRequestConfig = ():
  | AiGatewayCallRequestConfig
  | undefined => {
  const settings = loadAppSettings().aiGateway;
  if (!settings.enabled) {
    return undefined;
  }

  const requestConfig = getAiGatewayRequestConfig(settings);
  if (!requestConfig) {
    throw new Error(GATEWAY_INVALID_BASE_URL_ERROR);
  }

  return requestConfig;
};
