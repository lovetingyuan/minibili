// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

if (!config.resolver.sourceExts.includes('tw.css')) {
  config.resolver.sourceExts.push('tw.css')
}

config.transformer.babelTransformerPath = require.resolve(
  './scripts/babel-transformer',
)

module.exports = config

if (process.env.NODE_ENV === 'development') {
  const spawn = require('cross-spawn')

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

  child.stderr.on('data', data => {
    const input = data.toString().trim()
    console.log('TailwindCSS: ' + input)
  })
}
