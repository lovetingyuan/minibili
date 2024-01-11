// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const { spawn } = require('child_process')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.resolver.sourceExts.push('css')

const babelTransformer = require(config.transformer.babelTransformerPath)

config.transformer.babelTransformerPath = require.resolve(
  './scripts/babel-transformer.js',
)

module.exports = config

Object.defineProperty(config, '__babelTransformer', {
  get() {
    return babelTransformer
  },
})

if (config.server.port && config.watcher) {
  // 启动tailwindcss进程
  const child = spawn(
    'npx',
    'tailwindcss --no-autoprefixer -i ./node_modules/tailwindcss/tailwind.css -o ./src/style.tw.css --watch'.split(
      ' ',
    ),
    {
      cwd: __dirname,
    },
  )

  // child.stdout.on('data', data => {
  //   const input = data.toString().trim()
  //   console.log('tailwindcss: ' + input)
  // })
}
