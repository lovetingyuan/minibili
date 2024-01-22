module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      './scripts/babel-plugin-function-source.js',
      './scripts/babel-plugin-tailwind-classname.js',
    ],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  }
}
