import { textareaClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import type { AccentPreference } from '@/shared/utils/theme';
import type { InterfaceLayoutField } from '@client/features/settings/infrastructure/interfaceLayoutConfig';

export const ACCENT_OPTIONS: Array<{
  value: AccentPreference;
  swatchClassName: string;
}> = [
  { value: 'neutral', swatchClassName: 'bg-[var(--ink-1)]' },
  { value: 'blue', swatchClassName: 'bg-[#4f8ff7]' },
  { value: 'sky', swatchClassName: 'bg-[#67c9ff]' },
  { value: 'cyan', swatchClassName: 'bg-[#4fd7e8]' },
  { value: 'teal', swatchClassName: 'bg-[#33c6b6]' },
  { value: 'green', swatchClassName: 'bg-[#4fd67c]' },
  { value: 'emerald', swatchClassName: 'bg-[#34d399]' },
  { value: 'mint', swatchClassName: 'bg-[#7ddfc7]' },
  { value: 'lime', swatchClassName: 'bg-[#9fd84a]' },
  { value: 'yellow', swatchClassName: 'bg-[#f4d44d]' },
  { value: 'amber', swatchClassName: 'bg-[#f6bb54]' },
  { value: 'gold', swatchClassName: 'bg-[#d9a441]' },
  { value: 'orange', swatchClassName: 'bg-[#fb923c]' },
  { value: 'coral', swatchClassName: 'bg-[#ff7f67]' },
  { value: 'rose', swatchClassName: 'bg-[#ff8ac7]' },
  { value: 'pink', swatchClassName: 'bg-[#f472b6]' },
  { value: 'magenta', swatchClassName: 'bg-[#d946ef]' },
  { value: 'fuchsia', swatchClassName: 'bg-[#c026d3]' },
  { value: 'red', swatchClassName: 'bg-[#ef5f5f]' },
  { value: 'crimson', swatchClassName: 'bg-[#dc2626]' },
  { value: 'purple', swatchClassName: 'bg-[#a855f7]' },
  { value: 'lavender', swatchClassName: 'bg-[#b4a7ff]' },
  { value: 'plum', swatchClassName: 'bg-[#a65f9e]' },
  { value: 'violet', swatchClassName: 'bg-[#9b87f5]' },
];

export const SEGMENT_CONTAINER_CLASS =
  'inline-grid min-w-[15rem] grid-cols-2 gap-1 border border-[var(--line-1)] bg-[var(--bg-1)] p-1';

export const JSON_MODAL_TEXTAREA_CLASS = `${textareaClass} h-[min(24rem,calc(100vh-18rem))] font-mono text-xs`;
export const CUSTOM_FONT_PRESET_VALUE = '__custom__';
export const WIDE_INTERFACE_FIELDS = new Set<InterfaceLayoutField>(['accent', 'uiFontCustom']);

export const getSegmentButtonClassName = (active: boolean) =>
  `flex h-9 items-center justify-center gap-2 px-3 text-sm transition-colors duration-120 ease-out focus-visible:outline-none ${
    active
      ? 'bg-[var(--bg-2)] text-[var(--ink-1)]'
      : 'text-[var(--ink-3)] hover:text-[var(--ink-1)]'
  }`;

export const getAccentButtonClassName = (active: boolean) =>
  `flex h-12 w-full items-center justify-center transition-colors duration-120 ease-out focus-visible:outline-none ${
    active ? 'bg-[var(--accent-choice-active-bg)]' : 'hover:bg-[var(--accent-choice-hover-bg)]'
  }`;
