// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')

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
