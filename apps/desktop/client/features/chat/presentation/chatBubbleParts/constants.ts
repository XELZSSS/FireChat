export const TOOL_CARD_BASE_CLASS =
  'w-fit max-w-[min(40rem,100%)] border px-3.5 py-2.5 text-xs';
export const CITATION_CARD_CLASS =
  ' border border-[var(--line-1)] bg-[var(--bg-1)] px-3.5 py-2.5';
export const ATTACHMENT_CARD_CLASS =
  'flex min-w-0 max-w-[min(24rem,100%)] items-start gap-2 border border-[var(--line-1)] bg-[var(--bg-1)] px-3.5 py-2.5';
export const GENERATED_IMAGE_CARD_CLASS =
  'w-full max-w-[min(28rem,100%)] overflow-hidden border border-[var(--line-1)] bg-[var(--bg-1)]';
export const REASONING_BODY_CLASS =
  'max-w-[min(30rem,100%)] border border-[var(--line-1)] bg-[var(--bg-1)] px-3.5 py-2.5 text-xs text-[var(--ink-3)]';
export const REASONING_PANEL_CLASS =
  'grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-[var(--motion-slow)] ease-[var(--motion-ease-soft)]';
export const TOOL_CARD_VARIANT_CLASS = {
  default: 'border-[var(--line-1)] bg-[var(--bg-1)] text-[var(--ink-3)]',
  native:
    'border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--text-on-warning)]',
  error:
    'border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--text-on-brand)]',
} as const;
