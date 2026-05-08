import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const rendererRoot = path.resolve(projectRoot, 'apps/desktop/renderer');
const distRoot = path.resolve(projectRoot, 'dist');

const CODE_SPLITTING_GROUPS = [
  {
    name: 'react',
    test: /node_modules[\\/](react|react-dom)[\\/]/,
    priority: 40,
  },
  {
    name: 'ui',
    test: /node_modules[\\/](@radix-ui|lucide-react|tailwind-merge)[\\/]/,
    priority: 30,
  },
  {
    name: 'sdk-ai',
    test: /node_modules[\\/](ai|@ai-sdk[\\/](provider|provider-utils))[\\/]/,
    priority: 35,
  },
];

const buildV1Proxy = (target: string, prefix: string) => ({
  target,
  changeOrigin: true,
  secure: true,
  rewrite: (requestPath: string) => requestPath.replace(new RegExp(`^/${prefix}`), '/v1'),
});

const DEFERRED_ENTRY_PRELOAD_PATTERNS = [
  /assets\/code-highlighter-/,
  /assets\/provider-/,
  /assets\/sdk-ai-/,
  /assets\/sdk-openai-/,
];

const shouldDeferEntryPreload = (dependency: string): boolean =>
  DEFERRED_ENTRY_PRELOAD_PATTERNS.some((pattern) => pattern.test(dependency));

export default defineConfig(({ command, mode }) => {
  const resolvedMode = mode || (command === 'build' ? 'production' : 'development');
  const env = loadEnv(resolvedMode, projectRoot, '');
  const devServerHost = env.VITE_DEV_HOST || '127.0.0.1';

  return {
    root: rendererRoot,
    base: './',
    server: {
      port: 3000,
      strictPort: true,
      host: devServerHost,
      proxy: {
        '/minimax-intl': buildV1Proxy('https://api.minimax.io', 'minimax-intl'),
        '/minimax-cn': buildV1Proxy('https://api.minimaxi.com', 'minimax-cn'),
      },
    },
    plugins: [react()],
    define: {
      __APP_ENV__: JSON.stringify(resolvedMode),
    },
    resolve: {
      alias: {
        '@': rendererRoot,
        '@client': path.resolve(projectRoot, 'apps/desktop/client'),
        '@contracts': path.resolve(projectRoot, 'packages/contracts/src'),
        '@chat-core': path.resolve(projectRoot, 'packages/core/chat/src'),
        '@provider-core': path.resolve(projectRoot, 'packages/core/provider/src'),
        '@settings-core': path.resolve(projectRoot, 'packages/core/settings/src'),
      },
    },
    build: {
      target: 'es2022',
      modulePreload: {
        polyfill: false,
        resolveDependencies: (_filename, dependencies, context) =>
          context.hostType === 'html'
            ? dependencies.filter((dependency) => !shouldDeferEntryPreload(dependency))
            : dependencies,
      },
      outDir: distRoot,
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: CODE_SPLITTING_GROUPS,
          },
        },
      },
    },
  };
});
