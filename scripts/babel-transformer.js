const metro = require('../metro.config')
// const css2rn = require('css-to-react-native-transform').default
const postcss = require('postcss')
const cssvariables = require('postcss-css-variables')
const totailwind = require('./postcss-to-tailwind')

module.exports = {
  ...metro.__babelTransformer,
  transform: arg => {
    const { filename, src } = arg
    if (filename.endsWith('.tw.css')) {
      const cssObject = {}
      const { css } = postcss([
        cssvariables(/*options*/),
        totailwind({
          cssObject,
        }),
      ]).process(src)
      // console.log(33, cssObject)
      // const cssObject = css2rn(css, { parseMediaQueries: false })

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
