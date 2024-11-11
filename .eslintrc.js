module.exports = {
  root: true,
  env: {
    es2022: true,
  },
  extends: ['@react-native'],
  ignorePatterns: ['docs/**'],
  plugins: ['sonarjs', 'simple-import-sort', 'eslint-plugin-react-compiler'],
  parserOptions: {
    ecmaVersion: 2022,
  },
  globals: { inlineRequire: 'readonly', tw: 'readonly' },
  rules: {
    'no-undef': 'error',
    semi: [2, 'never'],
    'no-console': 'error',
    // '@typescript-eslint/consistent-type-imports': 'error',
    'no-duplicate-imports': 'error',
    '@typescript-eslint/no-import-type-side-effects': 'error',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'react-compiler/react-compiler': 'error',
  },
  overrides: [
    {
      files: ['scripts/*', '*.config.js', '*.test.ts'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
}
