module.exports = {
  root: true,
  env: {
    es2022: true,
  },
  extends: ['@react-native'],
  parserOptions: {
    ecmaVersion: 2022,
  },
  globals: { inlineRequire: 'readonly', tw: 'readonly' },
  rules: {
    'no-undef': 'error',
    semi: 'off',
    'no-console': 'error',
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
