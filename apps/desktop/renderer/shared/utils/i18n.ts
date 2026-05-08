import { EN_TRANSLATIONS } from '@/shared/utils/i18n-locales/en';
import { ZH_CN_TRANSLATIONS } from '@/shared/utils/i18n-locales/zh-CN';
import { loadAppSettings, updateAppSettings } from '@/infrastructure/persistence/appSettingsStore';

export type Language = 'en' | 'zh-CN';
export type LanguagePreference = Language;

const DEFAULT_LANGUAGE: Language = 'zh-CN';
const DEFAULT_LANGUAGE_PREFERENCE: LanguagePreference = 'zh-CN';

const isLanguage = (value: unknown): value is Language => value === 'en' || value === 'zh-CN';

const isLanguagePreference = (value: unknown): value is LanguagePreference => isLanguage(value);

const getStoredLanguagePreference = (): LanguagePreference | null => {
  const stored = loadAppSettings().languagePreference;
  return isLanguagePreference(stored) ? stored : null;
};

let currentLanguagePreference: LanguagePreference =
  getStoredLanguagePreference() ?? DEFAULT_LANGUAGE_PREFERENCE;
let currentLanguage: Language = currentLanguagePreference;

export const getLanguagePreference = (): LanguagePreference => currentLanguagePreference;

export const applyLanguageToDocument = (): void => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = currentLanguage;
  }
};

type SetLanguagePreferenceOptions = {
  persist?: boolean;
};

export const setLanguagePreference = (
  language: LanguagePreference,
  options: SetLanguagePreferenceOptions = {}
): Language => {
  const { persist = true } = options;
  currentLanguagePreference = isLanguagePreference(language)
    ? language
    : DEFAULT_LANGUAGE_PREFERENCE;
  currentLanguage = currentLanguagePreference;
  if (persist) {
    updateAppSettings({ languagePreference: currentLanguagePreference });
  }
  applyLanguageToDocument();
  return currentLanguage;
};

const translations: Record<Language, Record<string, string>> = {
  en: EN_TRANSLATIONS as unknown as Record<string, string>,
  'zh-CN': ZH_CN_TRANSLATIONS as unknown as Record<string, string>,
};

export const t = (key: string): string =>
  translations[currentLanguage][key] ?? translations.en[key] ?? key;
