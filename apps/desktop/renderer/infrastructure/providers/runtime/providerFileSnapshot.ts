import type { ProviderFileSnapshot } from '@contracts/provider-config';
import {
  getDesktopProviderConfigSnapshot,
  saveDesktopProviderConfigSnapshot,
} from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import { normalizeProviderFileSnapshot } from '@/infrastructure/providers/runtime/providerFileNormalization';

let cachedProviderFileSnapshot = normalizeProviderFileSnapshot(
  typeof window !== 'undefined' ? window.firechat?.config?.providerFiles : undefined
);

export const getProviderFileSnapshot = (): ProviderFileSnapshot => cachedProviderFileSnapshot;

export const setProviderFileSnapshot = (snapshot: ProviderFileSnapshot): ProviderFileSnapshot => {
  cachedProviderFileSnapshot = normalizeProviderFileSnapshot(snapshot);
  return cachedProviderFileSnapshot;
};

export const refreshProviderFileSnapshot = async (): Promise<ProviderFileSnapshot> => {
  return setProviderFileSnapshot(await getDesktopProviderConfigSnapshot());
};

export const persistProviderFileSnapshot = async (
  snapshot: ProviderFileSnapshot
): Promise<ProviderFileSnapshot> => {
  const persisted = await saveDesktopProviderConfigSnapshot(snapshot);
  return setProviderFileSnapshot(persisted);
};
