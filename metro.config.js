// This replaces `const { getDefaultConfig } = require('expo/metro-config');`
const { getSentryExpoConfig } = require('@sentry/react-native/metro')

// This replaces `const config = getDefaultConfig(__dirname);`
const config = getSentryExpoConfig(__dirname)

module.exports = config

require('@tingyuan/react-native-tailwindcss/tailwind')(__dirname)
