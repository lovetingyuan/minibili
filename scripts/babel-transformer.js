const postcss = require('postcss')
const cssvariables = require('postcss-css-variables')
const totailwind = require('./postcss-to-tailwind')
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(path.dirname(__dirname))

const babelTransformer = require(config.transformer.babelTransformerPath)

module.exports = {
  ...babelTransformer,
  transform: arg => {
    const { filename, src } = arg
    if (filename.endsWith('.tw.css')) {
      const cssObject = {}
      const { css } = postcss([
        cssvariables(/*options*/),
        totailwind({
          cssObject,
          ignoreClasses: ['transform', 'filter'],
        }),
      ]).process(src)
      return babelTransformer.transform({
        ...arg,
        src: `import { StyleSheet } from "react-native";\nexport default StyleSheet.create(${JSON.stringify(
          cssObject,
        )})`,
      })
    }
    return babelTransformer.transform(arg)
  },
}
