import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const sharedRules = {
  'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  'no-debugger': 'warn',
};

export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', 'release/**', '.cache/**']),
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: sharedRules,
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...sharedRules,
      'no-redeclare': 'off',
    },
  },
  {
    files: ['apps/desktop/renderer/public/**/*.js'],
    rules: {
      ...sharedRules,
      'no-redeclare': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      ...reactHooks.configs.flat.recommended.plugins,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...sharedRules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
]);
