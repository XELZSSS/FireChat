import { memo, useEffect, useState, useSyncExternalStore, type ComponentType } from 'react';
import { getTheme, type Theme } from '@/shared/utils/theme';

const RICH_CODE_STYLE = {
  margin: 0,
  padding: '1rem',
  backgroundColor: 'transparent',
  fontSize: '0.875rem',
  lineHeight: '1.75',
  width: 'max-content',
  minWidth: '100%',
} as const;

const CODE_FONT_FAMILY =
  '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const LANGUAGE_ALIASES: Record<string, string> = {
  apache: 'apacheconf',
  apacheconf: 'apacheconf',
  astro: 'markup',
  bat: 'batch',
  c: 'c',
  'c#': 'csharp',
  'c++': 'cpp',
  cc: 'cpp',
  cjs: 'javascript',
  clj: 'clojure',
  cljc: 'clojure',
  cljs: 'clojure',
  cmd: 'batch',
  conf: 'properties',
  cs: 'csharp',
  csharp: 'csharp',
  cxx: 'cpp',
  docker: 'docker',
  dockerfile: 'docker',
  'docker-compose': 'yaml',
  dotenv: 'properties',
  env: 'properties',
  erl: 'erlang',
  ex: 'elixir',
  exs: 'elixir',
  'f#': 'fsharp',
  fish: 'bash',
  fs: 'fsharp',
  fsx: 'fsharp',
  gitignore: 'git',
  glsl: 'glsl',
  go: 'go',
  'go.mod': 'goModule',
  gomod: 'goModule',
  golang: 'go',
  gql: 'graphql',
  graphql: 'graphql',
  handlebars: 'handlebars',
  hbs: 'handlebars',
  hpp: 'cpp',
  htm: 'markup',
  html: 'markup',
  ini: 'ini',
  java: 'java',
  js: 'javascript',
  json: 'json',
  jsonc: 'json5',
  jsx: 'jsx',
  ksh: 'bash',
  kt: 'kotlin',
  kts: 'kotlin',
  latex: 'latex',
  m: 'matlab',
  make: 'makefile',
  makefile: 'makefile',
  md: 'markdown',
  mdx: 'markdown',
  mjs: 'javascript',
  mmd: 'mermaid',
  nginxconf: 'nginx',
  objc: 'objectivec',
  'objective-c': 'objectivec',
  patch: 'diff',
  pl: 'perl',
  plantuml: 'plantUml',
  plist: 'markup',
  postgres: 'sql',
  postgresql: 'sql',
  proto: 'protobuf',
  ps: 'powershell',
  ps1: 'powershell',
  pwsh: 'powershell',
  py: 'python',
  py3: 'python',
  python3: 'python',
  r: 'r',
  rb: 'ruby',
  regexp: 'regex',
  rs: 'rust',
  sass: 'sass',
  scss: 'scss',
  shell: 'bash',
  shellsession: 'shellSession',
  sh: 'bash',
  sql: 'sql',
  sqlite: 'sql',
  svg: 'markup',
  svelte: 'markup',
  tex: 'latex',
  ts: 'typescript',
  tsx: 'tsx',
  vb: 'vbnet',
  vbnet: 'vbnet',
  vimscript: 'vim',
  vue: 'markup',
  xml: 'markup',
  zsh: 'bash',
  zig: 'zig',
  yml: 'yaml',
};

const normalizeHighlighterLanguage = (language: string): string =>
  language.trim().toLowerCase().replace(/^language-/, '');

const resolveHighlighterLanguage = (language: string): string => {
  const normalizedLanguage = normalizeHighlighterLanguage(language);
  return LANGUAGE_ALIASES[normalizedLanguage] ?? normalizedLanguage;
};

type SyntaxHighlighterModule = {
  SyntaxHighlighter: ComponentType<any> & {
    loadLanguage?: (language: string) => Promise<void>;
  };
  styles: Record<Theme, Record<string, unknown>>;
};

type SyntaxStyleRule = Record<string, unknown>;

type CodeBlockSyntaxHighlighterProps = {
  code: string;
  language: string;
  wrapCodeBlocks?: boolean;
};

let cachedHighlighter: SyntaxHighlighterModule | null = null;
let pendingHighlighter: Promise<SyntaxHighlighterModule> | null = null;

const readDocumentTheme = (): Theme => {
  if (typeof document === 'undefined') {
    return getTheme();
  }

  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
};

const subscribeDocumentTheme = (onChange: () => void) => {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  return () => {
    observer.disconnect();
  };
};

const useDocumentTheme = (): Theme =>
  useSyncExternalStore(subscribeDocumentTheme, readDocumentTheme, getTheme);

const removeCodeBlockBackground = (rule: unknown): SyntaxStyleRule => {
  const nextRule = { ...((rule as SyntaxStyleRule | undefined) ?? {}) };
  delete nextRule.background;
  delete nextRule.backgroundColor;
  return nextRule;
};

const normalizeCodeBlockStyle = (style: Record<string, unknown>): Record<string, unknown> => ({
  ...style,
  'pre[class*="language-"]': removeCodeBlockBackground(style['pre[class*="language-"]']),
});

const loadSyntaxHighlighter = async (): Promise<SyntaxHighlighterModule> => {
  if (cachedHighlighter) {
    return cachedHighlighter;
  }

  pendingHighlighter ??= Promise.all([
    import('react-syntax-highlighter/dist/esm/prism-async-light'),
    import('react-syntax-highlighter/dist/esm/styles/prism'),
  ]).then(async ([highlighter, styles]) => {
    const SyntaxHighlighter = highlighter.default as SyntaxHighlighterModule['SyntaxHighlighter'];
    await SyntaxHighlighter.loadLanguage?.('markup');
    await Promise.all([
      SyntaxHighlighter.loadLanguage?.('css'),
      SyntaxHighlighter.loadLanguage?.('javascript'),
    ]);

    cachedHighlighter = {
      SyntaxHighlighter,
      styles: {
        dark: normalizeCodeBlockStyle(styles.vscDarkPlus as Record<string, unknown>),
        light: normalizeCodeBlockStyle(styles.vs as Record<string, unknown>),
      },
    };
    return cachedHighlighter;
  });

  return pendingHighlighter;
};

const PlainCodeFallback = ({ code, wrapCodeBlocks }: { code: string; wrapCodeBlocks: boolean }) => (
  <pre
    className={`code-block-plain-code m-0 bg-transparent p-4 text-[0.875rem] leading-7 ${
      wrapCodeBlocks ? 'w-full whitespace-pre-wrap break-words' : 'min-w-full w-max'
    }`}
    style={{
      fontFamily: CODE_FONT_FAMILY,
    }}
  >
    <code>{code}</code>
  </pre>
);

const CodeBlockSyntaxHighlighter = ({
  code,
  language,
  wrapCodeBlocks = false,
}: CodeBlockSyntaxHighlighterProps) => {
  const [module, setModule] = useState<SyntaxHighlighterModule | null>(cachedHighlighter);
  const theme = useDocumentTheme();

  useEffect(() => {
    let isMounted = true;
    void loadSyntaxHighlighter().then((loaded) => {
      if (isMounted) {
        setModule(loaded);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!module) {
    return <PlainCodeFallback code={code} wrapCodeBlocks={wrapCodeBlocks} />;
  }

  const { SyntaxHighlighter, styles } = module;
  const highlighterLanguage = resolveHighlighterLanguage(language);

  return (
    <SyntaxHighlighter
      language={highlighterLanguage}
      style={styles[theme]}
      PreTag="div"
      customStyle={{
        ...RICH_CODE_STYLE,
        width: wrapCodeBlocks ? '100%' : 'max-content',
        minWidth: wrapCodeBlocks ? '0' : '100%',
      }}
      codeTagProps={{
        style: {
          fontFamily: CODE_FONT_FAMILY,
        },
      }}
      wrapLongLines={wrapCodeBlocks}
      showLineNumbers={false}
    >
      {code}
    </SyntaxHighlighter>
  );
};

export default memo(CodeBlockSyntaxHighlighter);
