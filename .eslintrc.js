module.exports = {
  root: true,
  extends: ['@react-native-community', 'plugin:valtio/recommended'],
  parserOptions: {
    ecmaVersion: 2022,
  },
  rules: {
    semi: 'off',
    'valtio/state-snapshot-rule': 'error',
    'valtio/avoid-this-in-proxy': 'error',
  },
  ignorePatterns: ['scripts/build.mjs'],
}
