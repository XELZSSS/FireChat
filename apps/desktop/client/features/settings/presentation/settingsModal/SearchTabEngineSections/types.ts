import type { TavilyConfig } from '@/shared/types/chat';
import type { SettingsValidationIssue } from '@client/features/settings/presentation/settingsModal/validation/validation';

export type SearchTabSharedProps = {
  tavily: TavilyConfig;
  toolCallMaxRounds: string;
  validationIssuesByField: Record<string, SettingsValidationIssue[]>;
  onSetTavilyField: <K extends keyof TavilyConfig>(key: K, value: TavilyConfig[K]) => void;
  onToolCallMaxRoundsChange: (value: string) => void;
  onToolCallMaxRoundsBlur: () => void;
};

