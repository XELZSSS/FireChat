type DropdownIconLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

type DropdownIconCacheEntry = {
  status: DropdownIconLoadStatus;
  promise?: Promise<string | null>;
};

const dropdownIconCache = new Map<string, DropdownIconCacheEntry>();

const getOrCreateDropdownIconEntry = (src: string): DropdownIconCacheEntry => {
  const cached = dropdownIconCache.get(src);
  if (cached) {
    return cached;
  }

  const entry: DropdownIconCacheEntry = {
    status: 'idle',
  };
  dropdownIconCache.set(src, entry);
  return entry;
};

const scheduleIdleTask = (task: () => void) => {
  if (typeof window === 'undefined') {
    task();
    return;
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(task, { timeout: 800 });
    return;
  }

  setTimeout(task, 0);
};

export const preloadDropdownIcon = (src: string): Promise<string | null> => {
  const entry = getOrCreateDropdownIconEntry(src);
  if (entry.status === 'loaded') {
    return Promise.resolve(src);
  }

  if (entry.status === 'loading' && entry.promise) {
    return entry.promise;
  }

  const promise = new Promise<string | null>((resolve) => {
    const image = new Image();

    const finish = (status: Extract<DropdownIconLoadStatus, 'loaded' | 'error'>) => {
      const nextEntry = getOrCreateDropdownIconEntry(src);
      nextEntry.status = status;
      nextEntry.promise = undefined;
      resolve(status === 'loaded' ? src : null);
    };

    image.decoding = 'async';
    image.onload = () => {
      finish('loaded');
    };
    image.onerror = () => {
      finish('error');
    };
    image.src = src;
  });

  entry.status = 'loading';
  entry.promise = promise;

  return promise;
};

export const preloadDropdownIcons = (sources: Iterable<string>): void => {
  const uniqueSources = Array.from(new Set(Array.from(sources).filter(Boolean)));
  if (uniqueSources.length === 0) {
    return;
  }

  scheduleIdleTask(() => {
    uniqueSources.forEach((src) => {
      void preloadDropdownIcon(src);
    });
  });
};
