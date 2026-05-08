const SYSTEM_LANGUAGE_POLL_INTERVAL_MS = 1500;

const createSystemLanguageMonitor = ({ getAppWindows, getSystemLanguage, onLanguageChanged }) => {
  let monitor = null;
  let lastSystemLanguage = null;

  const stop = () => {
    if (!monitor) return;
    clearInterval(monitor);
    monitor = null;
    lastSystemLanguage = null;
  };

  const sync = () => {
    if (getAppWindows().length === 0) {
      stop();
      return;
    }

    if (monitor) {
      return;
    }

    lastSystemLanguage = getSystemLanguage();
    monitor = setInterval(() => {
      if (getAppWindows().length === 0) {
        stop();
        return;
      }

      const nextLanguage = getSystemLanguage();
      if (nextLanguage === lastSystemLanguage) {
        return;
      }

      lastSystemLanguage = nextLanguage;
      onLanguageChanged();
    }, SYSTEM_LANGUAGE_POLL_INTERVAL_MS);
  };

  return {
    stop,
    sync,
  };
};

module.exports = {
  createSystemLanguageMonitor,
};
