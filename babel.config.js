module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['./scripts/babel-plugin-function-source.js', 'nativewind/babel'],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  }
}
