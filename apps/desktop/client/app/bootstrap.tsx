import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@client/app/App';
import { installConsoleStyle } from '@/shared/utils/consoleStyle';
import { hasFireChatBridge } from '@client/features/desktop-shell/infrastructure/firechatBridge';

(
  globalThis as typeof globalThis & {
    AI_SDK_LOG_WARNINGS?: boolean;
  }
).AI_SDK_LOG_WARNINGS = false;

const isProduction = typeof __APP_ENV__ !== 'undefined' && __APP_ENV__ === 'production';

const applyCsp = () => {
  if (!isProduction) return;
  const meta = Array.from(document.head.children).find(
    (element): element is HTMLMetaElement =>
      element instanceof HTMLMetaElement &&
      element.getAttribute('http-equiv') === 'Content-Security-Policy'
  );
  if (!meta) return;
  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' firechat: firechat-openadapter: ws://localhost:3000 https: http: ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  meta.setAttribute('content', directives.join('; '));
};

const notifyRendererReady = () => {
  if (!hasFireChatBridge()) {
    return;
  }

  window.dispatchEvent(new Event('firechat-renderer-ready'));
};

const scheduleRendererReadyNotification = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      notifyRendererReady();
    });
  });
};

export const bootstrapClientApp = () => {
  installConsoleStyle('renderer');
  applyCsp();

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Could not find root element to mount to');
  }

  const root = createRoot(rootElement);

  const app = !isProduction ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  );

  root.render(app);
  scheduleRendererReadyNotification();
};
