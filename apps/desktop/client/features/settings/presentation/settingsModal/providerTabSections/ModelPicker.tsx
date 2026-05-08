import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input } from '@/shared/ui';
import { smInputClass } from '@client/features/settings/presentation/settingsModal/sections/styles';
import { useInputValueHandler } from '@client/features/settings/presentation/settingsModal/actions/settingsInputHandlers';
import type { ProviderModelItem } from '@/infrastructure/providers/types';

type ModelPickerProps = {
  value: string;
  availableModels: ProviderModelItem[];
  isFetching: boolean;
  fetchError?: string | null;
  fetchingLabel: string;
  fetchLabel: string;
  noMatchesLabel: string;
  resultsPrefix: string;
  resultsSuffix: string;
  onChange: (value: string) => void;
  onFetch: () => void | Promise<void>;
};

const MAX_VISIBLE_MODEL_OPTIONS = 24;
const PANEL_CLASS =
  'absolute left-0 right-[6.5rem] top-[calc(100%+0.5rem)] z-20 overflow-hidden border border-[var(--line-1)] bg-[var(--bg-1)] shadow-lg';
const MODEL_OPTION_CLASS =
  'flex w-full items-center px-2.5 py-2 text-left text-sm text-[var(--ink-2)] transition-colors duration-120 ease-out hover:bg-[var(--bg-2)] hover:text-[var(--ink-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-interactive)]';

const buildModelOptions = (availableModels: ProviderModelItem[]) =>
  availableModels.map((model) => ({
    value: model.id,
    label: model.group ? `${model.name} · ${model.group}` : model.name,
  }));

const filterModelOptions = (
  modelOptions: Array<{ value: string; label: string }>,
  query: string
) => {
  const matches = query
    ? modelOptions.filter(
        (option) =>
          option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query)
      )
    : modelOptions;

  return matches.slice(0, MAX_VISIBLE_MODEL_OPTIONS);
};

export const ModelPicker = ({
  value,
  availableModels,
  isFetching,
  fetchError,
  fetchingLabel,
  fetchLabel,
  noMatchesLabel,
  resultsPrefix,
  resultsSuffix,
  onChange,
  onFetch,
}: ModelPickerProps) => {
  const handleValueChange = useInputValueHandler(onChange);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const deferredValue = useDeferredValue(value);
  const modelOptions = useMemo(() => buildModelOptions(availableModels), [availableModels]);
  const filteredModelOptions = useMemo(
    () => filterModelOptions(modelOptions, deferredValue.trim().toLowerCase()),
    [deferredValue, modelOptions]
  );
  const shouldShowPanel = isPanelOpen && modelOptions.length > 0;

  useEffect(() => {
    if (!shouldShowPanel) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [shouldShowPanel]);

  const handleSelectModel = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      setIsPanelOpen(false);
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <div ref={panelRef} className="relative flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={handleValueChange}
          onFocus={() => setIsPanelOpen(true)}
          className={`${smInputClass} flex-1`}
          compact
          autoComplete="off"
        />
        <Button
          onClick={() => {
            void onFetch();
          }}
          variant="subtle"
          size="md"
          className="min-w-[5.5rem] px-3 text-sm"
          disabled={isFetching}
        >
          {isFetching ? fetchingLabel : fetchLabel}
        </Button>
        {shouldShowPanel ? (
          <div className={PANEL_CLASS}>
            <div className="max-h-64 overflow-y-auto p-1.5 scrollbar-hide">
              {filteredModelOptions.length > 0 ? (
                filteredModelOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectModel(option.value)}
                    className={MODEL_OPTION_CLASS}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-2.5 py-2 text-sm text-[var(--ink-3)]">{noMatchesLabel}</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {modelOptions.length > 0 ? (
        <div className="text-[11px] leading-5 text-[var(--ink-3)]">
          {filteredModelOptions.length > 0
            ? `${resultsPrefix}${filteredModelOptions.length}${resultsSuffix}`
            : noMatchesLabel}
        </div>
      ) : null}
      {fetchError ? (
        <div className="text-[11px] leading-5 text-[var(--status-error)]">{fetchError}</div>
      ) : null}
    </div>
  );
};

