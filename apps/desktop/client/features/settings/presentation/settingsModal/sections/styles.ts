const inputBaseClass =
  ' bg-[var(--bg-2)] text-[var(--ink-1)] outline-none ring-1 ring-[var(--line-1)] focus:ring-[var(--action-interactive)] placeholder:text-[var(--ink-3)]';

const textareaBaseClass =
  'px-3 py-2 text-sm leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-shadow duration-160 ease-out focus:ring-2 focus:ring-[var(--action-interactive)]';

export const fullInputClass = `w-full ${inputBaseClass}`;
export const smInputClass = `w-64 ${inputBaseClass}`;
export const textareaClass = `w-full resize-none ${inputBaseClass} ${textareaBaseClass}`;
export const settingsCardClass = 'border border-[var(--line-1)] bg-[var(--bg-2)]/40 p-3';
export const settingsSectionLabelClass = 'text-xs font-medium text-[var(--ink-2)]';
export const settingsSubLabelClass = 'text-xs text-[var(--ink-2)]';
export const settingsHintClass = 'text-[11px] leading-5 text-[var(--ink-2)]';
export const settingsToggleRowClass = 'flex min-h-8 items-center gap-2 text-xs text-[var(--ink-2)]';
