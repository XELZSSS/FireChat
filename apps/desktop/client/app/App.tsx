import { type CSSProperties } from 'react';
import { useAppController } from '@client/app/application/useAppController';
import Sidebar from '@client/features/sessions/presentation/Sidebar';
import ChatMain from '@client/features/chat/presentation/shell/ChatMain';
import TitleBar from '@client/features/desktop-shell/presentation/TitleBar';
import SettingsModal from '@client/features/settings/presentation/SettingsModal';

export default function App() {
  const { language, settingsModalProps, sidebarProps, chatMainProps } = useAppController();
  const sidebarWidth = sidebarProps.collapsed ? '4rem' : '21.5rem';
  const shellStyle = {
    '--sidebar-width': sidebarWidth,
  } as CSSProperties;

  return (
    <>
      <TitleBar
        language={language}
        hasSidebar
        sidebarWidth={sidebarWidth}
        sidebarCollapsed={sidebarProps.collapsed}
        onToggleSidebar={sidebarProps.onToggleCollapsed}
      />

      <div
        className="app-shell relative h-screen overflow-hidden text-[var(--ink-1)]"
        style={shellStyle}
      >
        {settingsModalProps.isOpen ? <SettingsModal {...settingsModalProps} /> : null}

        <div className="sidebar-shell" data-collapsed={sidebarProps.collapsed ? 'true' : 'false'}>
          <Sidebar {...sidebarProps} />
        </div>

        <ChatMain {...chatMainProps} />
      </div>
    </>
  );
}

