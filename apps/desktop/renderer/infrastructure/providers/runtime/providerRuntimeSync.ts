import type { ProviderFileSnapshot } from '@contracts/provider-config';
import {
  getProviderFileSnapshot,
  persistProviderFileSnapshot,
} from '@/infrastructure/providers/runtime/providerFileSnapshot';
import { invalidateProviderRuntimeCatalog } from '@/infrastructure/providers/config/providerConfig';

export const getCurrentProviderFileSnapshot = (): ProviderFileSnapshot => getProviderFileSnapshot();

export const persistProviderRuntimeState = async (
  snapshot: ProviderFileSnapshot
): Promise<ProviderFileSnapshot> => {
  const persisted = await persistProviderFileSnapshot(snapshot);
  invalidateProviderRuntimeCatalog();
  return persisted;
};
