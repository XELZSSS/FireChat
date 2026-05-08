import { memo, useCallback, useEffect, useState, type CSSProperties } from 'react';
import {
  closeAppWindow,
  getAppWindowMaximized,
  isDesktopEnvironment,
  minimizeAppWindow,
  onAppWindowMaximizeChanged,
  toggleAppWindowMaximize,
} from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import type { Language } from '@/shared/utils/i18n';
import { t } from '@/shared/utils/i18n';
import ButtonPrimitive from '@/shared/ui/primitives/button';
import { LeftPanelCloseIcon, LeftPanelOpenIcon } from '@/shared/ui/icons';

type WindowControlType = 'min' | 'max' | 'close';
type TitleBarControlConfig = {
  control: WindowControlType;
  label: string;
  onClick: () => void;
  className?: string;
};

const BUTTON_CLASS = 'titlebar-btn focus-visible:outline-none';
const CLOSE_BUTTON_CLASS = `${BUTTON_CLASS} titlebar-btn-close`;

const WinIcon = memo(function WinIcon({ type }: { type: WindowControlType }) {
  switch (type) {
    case 'min':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <rect x="1" y="5" width="8" height="1" fill="currentColor" />
        </svg>
      );
    case 'max':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <rect
            x="1.5"
            y="1.5"
            width="7"
            height="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      );
    default:
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
  }
});

const getTitleBarStyle = (
  hasSidebar: boolean,
  sidebarWidth?: string
): CSSProperties | undefined => {
  if (!hasSidebar || !sidebarWidth) {
    return undefined;
  }

  return {
    '--sidebar-width': sidebarWidth,
  } as CSSProperties;
};

const TitleBarControlButton = memo(function TitleBarControlButton({
  control,
  label,
  onClick,
  className = BUTTON_CLASS,
}: {
  control: WindowControlType;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <ButtonPrimitive className={className} onClick={onClick} aria-label={label} title={label}>
      <WinIcon type={control} />
      {control === 'max' ? <span className="sr-only">{label}</span> : null}
    </ButtonPrimitive>
  );
});

type TitleBarProps = {
  language: Language;
  hasSidebar: boolean;
  sidebarWidth?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
};

const TitleBarComponent = ({
  language,
  hasSidebar,
  sidebarWidth,
  sidebarCollapsed = false,
  onToggleSidebar,
}: TitleBarProps) => {
  const [maximized, setMaximized] = useState(false);
  const maximizeLabel = maximized ? t('titlebar.restore') : t('titlebar.maximize');
  const style = getTitleBarStyle(hasSidebar, sidebarWidth);
  const isDesktop = isDesktopEnvironment();
  const sidebarToggleLabel = sidebarCollapsed ? t('sidebar.open') : t('sidebar.close');

  const handleMinimize = useCallback(() => void minimizeAppWindow(), []);
  const handleToggleMaximize = useCallback(() => void toggleAppWindowMaximize(), []);
  const handleClose = useCallback(() => void closeAppWindow(), []);
  const controls: TitleBarControlConfig[] = [
    {
      control: 'min',
      label: t('titlebar.minimize'),
      onClick: handleMinimize,
    },
    {
      control: 'max',
      label: maximizeLabel,
      onClick: handleToggleMaximize,
    },
    {
      control: 'close',
      label: t('titlebar.close'),
      onClick: handleClose,
      className: CLOSE_BUTTON_CLASS,
    },
  ];

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    void getAppWindowMaximized().then((value) => setMaximized(value));
    return onAppWindowMaximizeChanged((value) => setMaximized(value));
  }, [isDesktop]);

  if (!isDesktop) {
    return null;
  }

  return (
    <div
      className="titlebar"
      data-has-sidebar={hasSidebar ? 'true' : 'false'}
      data-language={language}
      style={style}
    >
      <div className="titlebar-drag">
        {hasSidebar && onToggleSidebar ? (
          <ButtonPrimitive
            className="titlebar-sidebar-btn titlebar-no-drag"
            onClick={onToggleSidebar}
            aria-label={sidebarToggleLabel}
            aria-expanded={!sidebarCollapsed}
            title={sidebarToggleLabel}
          >
            {sidebarCollapsed ? (
              <LeftPanelOpenIcon size={16} strokeWidth={2} />
            ) : (
              <LeftPanelCloseIcon size={16} strokeWidth={2} />
            )}
          </ButtonPrimitive>
        ) : null}
      </div>
      <div className="titlebar-controls">
        {controls.map((control) => (
          <TitleBarControlButton key={control.control} {...control} />
        ))}
      </div>
    </div>
  );
};

const TitleBar = memo(TitleBarComponent);
export default TitleBar;
