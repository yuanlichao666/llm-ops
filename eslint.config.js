const eslint = require('@eslint/js')
const { defineConfig, globalIgnores } = require('eslint/config')
const globals = require('globals')
const tseslint = require('typescript-eslint')
const eslintPrettier = require('eslint-plugin-prettier')
const importSort = require('eslint-plugin-simple-import-sort')
const reactHooks = require('eslint-plugin-react-hooks')
const reactRefresh = require('eslint-plugin-react-refresh')
const pluginNext = require('@next/eslint-plugin-next')

const ignores = ['**/.next/**', 'dist', 'build', '**/*.js', '**/*.mjs', '**/*.d.ts', 'eslint.config.js', 'commitlint.config.js']

const frontendConfig = {
  files: ['apps/frontend/**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    '@next/next': pluginNext,
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'no-console': 'error',
  },
}

const backendConfig = {
  files: ['apps/backend/**/*.ts'],
  languageOptions: {
    globals: {
      ...globals.node, // global
      ...globals.jest,
    },
    parser: tseslint.parser,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'error',
  },
}

module.exports = defineConfig(
  globalIgnores(ignores),
  {
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      prettier: eslintPrettier,
      'simple-import-sort': importSort,
    },
    rules: {
      'prettier/prettier': 'error',
      'simple-import-sort/imports': 'error',
    },
  },
  frontendConfig,
  backendConfig
)
