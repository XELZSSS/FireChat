import type { Dispatch, SetStateAction } from 'react';
import type { ChatService } from '@client/features/chat/application/chatService';
import type {
  ProviderSettingsMap,
  SaveSettingsPayload,
} from '@client/features/settings/domain/settingsTypes';
import type { AppFontSize, SendShortcut } from '@/shared/utils/appOptions';
import type { Language, LanguagePreference } from '@/shared/utils/i18n';
import type { AccentPreference, Theme, ThemePreference } from '@/shared/utils/theme';
import type { PetSettings } from '@client/features/pet/domain/petTypes';

export type AppPreferenceStateSetters = {
  setLanguagePreferenceState: Dispatch<SetStateAction<LanguagePreference>>;
  setLanguageState: Dispatch<SetStateAction<Language>>;
  setThemePreferenceState: Dispatch<SetStateAction<ThemePreference>>;
  setThemeState: Dispatch<SetStateAction<Theme>>;
  setAccentPreferenceState: Dispatch<SetStateAction<AccentPreference>>;
  setSidebarCollapsedState: Dispatch<SetStateAction<boolean>>;
  setUiFontFamilyState: Dispatch<SetStateAction<string>>;
  setUiFontSizeState: Dispatch<SetStateAction<AppFontSize>>;
  setSendShortcutState: Dispatch<SetStateAction<SendShortcut>>;
  setShowMessageTimestampsState: Dispatch<SetStateAction<boolean>>;
  setWrapCodeBlocksState: Dispatch<SetStateAction<boolean>>;
  setPetSettingsState: Dispatch<SetStateAction<PetSettings>>;
  setReduceMotionState: Dispatch<SetStateAction<boolean>>;
  setCloseToTrayState: Dispatch<SetStateAction<boolean>>;
  setMinimizeToTrayState: Dispatch<SetStateAction<boolean>>;
  setLaunchAtStartupState: Dispatch<SetStateAction<boolean>>;
  setStartMinimizedToTrayState: Dispatch<SetStateAction<boolean>>;
  setRememberWindowBoundsState: Dispatch<SetStateAction<boolean>>;
  syncTrayLabels: (language: Language) => void;
};

export type SaveSettingsTransactionOptions = AppPreferenceStateSetters & {
  value: SaveSettingsPayload;
  chatService: ChatService;
  providerSettings: ProviderSettingsMap;
  hasMessages: boolean;
  syncDefaultProviderState: () => void;
  syncConversationState: () => void;
};

export type RollbackStack = {
  push(label: string, run: () => void | Promise<void>): void;
  rollback(): Promise<void>;
};
