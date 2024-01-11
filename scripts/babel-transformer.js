const metro = require('../metro.config')
const css2rn = require('css-to-react-native-transform').default
const postcss = require('postcss')
const cssvariables = require('postcss-css-variables')
const rgbtoa = require('./postcss-rgb-a')

module.exports = {
  ...metro.__babelTransformer,
  transform: arg => {
    const { filename, src } = arg
    if (filename.endsWith('.tw.css')) {
      const { css } = postcss([cssvariables(/*options*/), rgbtoa()]).process(
        src,
      )

      const cssObject = css2rn(css, { parseMediaQueries: false })

      return metro.__babelTransformer.transform({
        ...arg,
        src: `import { StyleSheet } from "react-native";\nexport default StyleSheet.create(${JSON.stringify(
          cssObject,
        )})`,
      })
    }
    return metro.__babelTransformer.transform(arg)
  },
}
