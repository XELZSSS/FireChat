import { memo, useMemo, type ReactNode } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/shared/ui/cn';
import { KeyboardArrowDownIcon } from '@/shared/ui/icons';

export type DropdownOption = {
  value: string;
  label: string;
  group?: string;
  iconSrc?: string;
};

export type DropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  widthClassName?: string;
  disabled?: boolean;
  wrapLabel?: boolean;
  placeholder?: string;
};

const DEFAULT_WIDTH_CLASS = 'w-56';
const TRIGGER_CLASS =
  'flex h-9 w-full items-center justify-between border border-[var(--line-1)] bg-[var(--bg-2)] px-3 text-sm text-[var(--ink-2)] outline-none transition-[background-color,border-color,color,box-shadow] duration-[var(--motion-base)] ease-[var(--motion-ease-standard)] placeholder:text-[var(--ink-3)] focus:ring-2 focus:ring-[var(--action-interactive)] disabled:cursor-not-allowed disabled:opacity-50';
const CONTENT_CLASS =
  'ui-popover-motion z-[90] max-h-64 overflow-hidden border border-[var(--line-1)] bg-[var(--bg-1)] p-1 shadow-lg';
const VIEWPORT_CLASS = 'dropdown-scroll-viewport max-h-56 overflow-y-auto overflow-x-hidden';
const LABEL_CLASS =
  'px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] first:pt-1';
const ITEM_CLASS =
  'relative flex w-full cursor-default items-center px-2.5 py-2 text-sm text-[var(--ink-2)] outline-none transition-[background-color,color,opacity] duration-[var(--motion-fast)] ease-[var(--motion-ease-standard)] focus:bg-transparent focus:text-[var(--ink-1)] data-[state=checked]:bg-transparent data-[state=checked]:font-medium data-[state=checked]:text-[var(--ink-1)]';
const OPTION_CONTENT_CLASS = 'flex min-w-0 items-center gap-2.5 text-sm font-normal leading-5';
const OPTION_ICON_CLASS = 'h-4 w-4 shrink-0 object-contain';

const DropdownOptionIcon = memo(({ src }: { src: string }) => {
  return (
    <img
      src={src}
      alt=""
      className={OPTION_ICON_CLASS}
      aria-hidden="true"
      decoding="async"
      loading="eager"
      draggable={false}
    />
  );
});

const DropdownOptionContent = memo(
  ({
    iconSrc,
    children,
    wrapLabel = false,
  }: {
    iconSrc?: string;
    children: ReactNode;
    wrapLabel?: boolean;
  }) => (
    <span className={OPTION_CONTENT_CLASS}>
      {iconSrc ? <DropdownOptionIcon src={iconSrc} /> : null}
      <span
        className={cn(
          'min-w-0 flex-1',
          wrapLabel ? 'whitespace-normal break-all leading-5' : 'truncate'
        )}
      >
        {children}
      </span>
    </span>
  )
);

const DropdownOptionItemText = memo(
  ({ option, wrapLabel = false }: { option: DropdownOption; wrapLabel?: boolean }) => (
    <DropdownOptionContent iconSrc={option.iconSrc} wrapLabel={wrapLabel}>
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
    </DropdownOptionContent>
  )
);

const DropdownSelectedValue = memo(
  ({ option, wrapLabel = false }: { option: DropdownOption; wrapLabel?: boolean }) => (
    <DropdownOptionContent iconSrc={option.iconSrc} wrapLabel={wrapLabel}>
      {option.label}
    </DropdownOptionContent>
  )
);

const DropdownPlaceholder = memo(({ children }: { children: string }) => (
  <span className="text-sm font-normal leading-5 text-[var(--ink-3)]">{children}</span>
));

const buildGroupedOptions = (options: DropdownOption[]) => {
  let previousGroup: string | undefined;

  return options.map((option) => {
    const shouldRenderGroupLabel = Boolean(option.group) && option.group !== previousGroup;
    previousGroup = option.group;
    return { option, shouldRenderGroupLabel };
  });
};

const resolveSelectedContent = (
  selectedOption: DropdownOption | undefined,
  wrapLabel = false,
  placeholder?: string
): ReactNode => {
  if (!selectedOption) {
    return placeholder ? <DropdownPlaceholder>{placeholder}</DropdownPlaceholder> : null;
  }

  return <DropdownSelectedValue option={selectedOption} wrapLabel={wrapLabel} />;
};

const Dropdown = ({
  value,
  options,
  onChange,
  widthClassName,
  disabled = false,
  wrapLabel = false,
  placeholder,
}: DropdownProps) => {
  const groupedOptions = useMemo(() => buildGroupedOptions(options), [options]);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );
  const selectedContent = useMemo(
    () => resolveSelectedContent(selectedOption, wrapLabel, placeholder),
    [placeholder, selectedOption, wrapLabel]
  );

  return (
    <div className={cn('w-full', widthClassName ?? DEFAULT_WIDTH_CLASS)}>
      <SelectPrimitive.Root value={value} onValueChange={onChange}>
        <SelectPrimitive.Trigger
          className={cn(TRIGGER_CLASS, wrapLabel && 'h-auto min-h-9 items-start py-2')}
          aria-label={value}
          disabled={disabled}
        >
          <span className="min-w-0 flex-1 pr-3 text-sm font-normal leading-5">
            {selectedContent}
          </span>
          <SelectPrimitive.Icon asChild>
            <KeyboardArrowDownIcon
              size={16}
              strokeWidth={2}
              className={cn('text-[var(--ink-3)]', wrapLabel && 'mt-0.5 self-start')}
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content position="popper" sideOffset={12} className={CONTENT_CLASS}>
            <SelectPrimitive.Viewport className={VIEWPORT_CLASS}>
              {groupedOptions.map(({ option, shouldRenderGroupLabel }) => (
                <div key={option.value}>
                  {shouldRenderGroupLabel ? (
                    <SelectPrimitive.Label className={LABEL_CLASS}>
                      {option.group}
                    </SelectPrimitive.Label>
                  ) : null}
                  <SelectPrimitive.Item value={option.value} className={ITEM_CLASS}>
                    <DropdownOptionItemText option={option} wrapLabel={wrapLabel} />
                  </SelectPrimitive.Item>
                </div>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
};

export default memo(Dropdown);
