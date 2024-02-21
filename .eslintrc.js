module.exports = {
  root: true,
  env: {
    es2022: true,
  },
  extends: ['@react-native'],
  plugins: ['sonarjs', 'simple-import-sort'],

  parserOptions: {
    ecmaVersion: 2022,
  },
  globals: { inlineRequire: 'readonly', tw: 'readonly' },
  rules: {
    'no-undef': 'error',
    semi: [2, 'never'],
    'no-console': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    'no-duplicate-imports': 'error',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
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
