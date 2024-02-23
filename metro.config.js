// This replaces `const { getDefaultConfig } = require('expo/metro-config');`
const { getSentryExpoConfig } = require('@sentry/react-native/metro')

// This replaces `const config = getDefaultConfig(__dirname);`
const config = getSentryExpoConfig(__dirname)

// const src = require('path').posix.resolve('src')
// config.resolver.resolveRequest = (context, moduleName, platform) => {
//   if (moduleName.startsWith('@/')) {
//     moduleName = moduleName.replace('@/', src + '/')
//   }
//   return context.resolveRequest(context, moduleName, platform)
// }

module.exports = config

require('@tingyuan/react-native-tailwindcss/tailwind')(__dirname)
