import { useCallback, useId, useMemo, type KeyboardEvent } from 'react';
import { cn } from '@/shared/ui/cn';

export type TabItem<T extends string> = {
  id: T;
  label: string;
};

export type TabsProps<T extends string> = {
  items: Array<TabItem<T>>;
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  idPrefix?: string;
};

const TAB_BASE =
  'border-b-0 border-l-0 border-transparent px-3 py-2.5 text-left text-sm font-medium transition-[color,border-color,background-color,opacity,transform] duration-[var(--motion-base)] ease-[var(--motion-ease-standard)] focus-visible:outline-none';

const TAB_STYLES = {
  active: 'border-transparent bg-transparent text-[var(--ink-1)]',
  inactive:
    'text-[var(--ink-3)] hover:border-[var(--line-1)] hover:bg-transparent hover:text-[var(--ink-1)]',
} as const;

const NAVIGATION_KEYS = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];

const getNextTabIndex = (key: string, currentIndex: number, itemCount: number) => {
  if (key === 'Home') return 0;
  if (key === 'End') return itemCount - 1;
  if (key === 'ArrowUp' || key === 'ArrowLeft') return (currentIndex - 1 + itemCount) % itemCount;
  return (currentIndex + 1) % itemCount;
};

const Tabs = <T extends string>({
  items,
  activeId,
  onChange,
  className,
  idPrefix,
}: TabsProps<T>) => {
  const autoId = useId().replace(/:/g, '');
  const prefix = useMemo(() => idPrefix ?? `tabs-${autoId}`, [autoId, idPrefix]);
  const handleValueChange = useCallback((value: string) => onChange(value as T), [onChange]);
  const getTabId = useCallback((id: T) => `${prefix}-tab-${id}`, [prefix]);
  const getPanelId = useCallback((id: T) => `${prefix}-panel-${id}`, [prefix]);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!NAVIGATION_KEYS.includes(event.key) || items.length === 0) return;

      event.preventDefault();
      const currentIndex = Math.max(
        0,
        items.findIndex((item) => item.id === activeId)
      );
      const nextItem = items[getNextTabIndex(event.key, currentIndex, items.length)];
      onChange(nextItem.id);
      requestAnimationFrame(() => document.getElementById(getTabId(nextItem.id))?.focus());
    },
    [activeId, getTabId, items, onChange]
  );

  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      className={cn('w-40 flex-none', className)}
    >
      <div className="flex w-full flex-col gap-1.5 overflow-visible border-r border-[var(--line-1)] pr-4">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={getTabId(item.id)}
              aria-controls={getPanelId(item.id)}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleValueChange(item.id)}
              className={cn(TAB_BASE, isActive ? TAB_STYLES.active : TAB_STYLES.inactive)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
