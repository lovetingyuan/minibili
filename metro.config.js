const { getDefaultConfig } = require('expo/metro-config')
module.exports = getDefaultConfig(__dirname)

require('@tingyuan/react-native-tailwindcss/tailwind')(__dirname)
