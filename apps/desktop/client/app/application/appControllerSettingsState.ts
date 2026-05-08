import { useCallback, useState } from 'react';

export const useAppControllerSettingsState = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  return {
    isSettingsOpen,
    handleCloseSettings,
    handleOpenSettings,
  };
};
