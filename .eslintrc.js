module.exports = {
  root: true,
  env: {
    es2022: true,
  },
  extends: ['@react-native-community', 'plugin:valtio/recommended'],
  parserOptions: {
    ecmaVersion: 2022,
  },
  globals: { inlineRequire: 'readonly' },
  rules: {
    'no-undef': 'error',
    semi: 'off',
    'valtio/state-snapshot-rule': 'error',
    'valtio/avoid-this-in-proxy': 'error',
    'no-console': 'error',
  },
}
