export type UpdaterStatus = {
  status: 'idle' | 'disabled' | 'checking' | 'available' | 'not-available' | 'error';
  distribution: 'development' | 'installer';
  message: string;
  version: string;
  availableVersion: string;
  error: string;
};

export const DEFAULT_UPDATER_STATUS: UpdaterStatus = {
  status: 'idle',
  distribution: 'development',
  message: '',
  version: '',
  availableVersion: '',
  error: '',
};
