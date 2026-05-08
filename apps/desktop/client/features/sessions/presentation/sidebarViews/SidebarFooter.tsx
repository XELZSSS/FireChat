import { Button, IconButton } from '@/shared/ui';
import {
  DarkModeOutlinedIcon,
  LanguageIcon,
  LightModeOutlinedIcon,
  SettingsOutlinedIcon,
} from '@/shared/ui/icons';
import { t, type LanguagePreference } from '@/shared/utils/i18n';
import type { ThemePreference } from '@/shared/utils/theme';
import { SIDEBAR_FOOTER_BUTTON_CLASS } from '@client/features/sessions/presentation/sidebarHelpers';

export function SidebarFooter({
  collapsed,
  languagePreference,
  themePreference,
  onLanguagePreferenceChange,
  onThemePreferenceChange,
  onOpenSettings,
}: {
  collapsed: boolean;
  languagePreference: LanguagePreference;
  themePreference: ThemePreference;
  onLanguagePreferenceChange: (value: LanguagePreference) => void;
  onThemePreferenceChange: (value: ThemePreference) => void;
  onOpenSettings: () => void;
}) {
  const nextLanguage = languagePreference === 'zh-CN' ? 'en' : 'zh-CN';
  const nextTheme = themePreference === 'dark' ? 'light' : 'dark';
  const ThemeIcon = themePreference === 'dark' ? DarkModeOutlinedIcon : LightModeOutlinedIcon;
  const iconButtonClassName =
    'h-9 w-9 transform-none bg-transparent text-[var(--ink-2)] hover:bg-transparent hover:text-[var(--accent-strong)] active:scale-100';

  return (
    <div className={`mt-auto w-full ${collapsed ? 'space-y-2 pt-2' : 'space-y-1.5'}`}>
      <div className={collapsed ? 'flex flex-col items-center gap-1' : 'flex items-center gap-1'}>
        <IconButton
          onClick={() => onLanguagePreferenceChange(nextLanguage)}
          variant="ghost"
          title={t('sidebar.language')}
          aria-label={t('sidebar.language')}
          className={iconButtonClassName}
        >
          <LanguageIcon size={16} strokeWidth={2} />
        </IconButton>
        <IconButton
          onClick={() => onThemePreferenceChange(nextTheme)}
          variant="ghost"
          title={t('sidebar.toggleTheme')}
          aria-label={t('sidebar.toggleTheme')}
          className={iconButtonClassName}
        >
          <ThemeIcon size={16} strokeWidth={2} />
        </IconButton>
      </div>

      {collapsed ? (
        <div className="flex justify-center">
          <IconButton
            onClick={onOpenSettings}
            variant="ghost"
            aria-label={t('sidebar.settings')}
            title={t('sidebar.settings')}
            className={iconButtonClassName}
          >
            <SettingsOutlinedIcon size={16} strokeWidth={2} />
          </IconButton>
        </div>
      ) : (
        <Button
          onClick={onOpenSettings}
          variant="ghost"
          size="md"
          className={`group transform-none ${SIDEBAR_FOOTER_BUTTON_CLASS} hover:bg-transparent active:scale-100`}
        >
          <SettingsOutlinedIcon
            className="text-[var(--ink-2)] transition-colors duration-[var(--motion-base)] ease-[var(--motion-ease-standard)] group-hover:text-[var(--accent-strong)]"
            size={16}
            strokeWidth={2}
          />
          <span className="tracking-[0.015em]">{t('sidebar.settings')}</span>
        </Button>
      )}
    </div>
  );
}
