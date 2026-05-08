declare module 'react-syntax-highlighter/dist/esm/prism-async-light' {
  import * as React from 'react';
  import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';

  export default class SyntaxHighlighter extends React.Component<SyntaxHighlighterProps> {}
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  import type * as React from 'react';

  export const oneDark: { [key: string]: React.CSSProperties };
}
