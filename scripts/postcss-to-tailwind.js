// color: rgb(52 211 153 / 1);
// -->
// color: rgb(52, 211, 153, 1);
const transform = require('css-to-react-native')

/**
 * @type {import('postcss').PluginCreator}
 * @param {{ cssObject: Record<string, any> }} opts options
 */
module.exports = (
  opts = {
    cssObject: {},
    ignoreClasses: [],
  },
) => {
  // Work with options here

  return {
    postcssPlugin: 'postcss-css-to-tailwind',
    /*
    Root (root, postcss) {
      // Transform CSS AST here
    }
    */
    DeclarationExit(decl) {
      // 检查属性声明是否在顶层的class选择器规则中
      if (
        decl.parent.type === 'rule' &&
        decl.parent.parent.type === 'root' &&
        decl.parent.selector.startsWith('.')
      ) {
        let { prop, value } = decl
        if (opts.ignoreClasses?.includes(prop)) {
          return
        }
        // console.log('DeclarationExit', decl.parent.selector, prop, value)

        if (value.startsWith('rgb(')) {
          const val = value.slice(4, -1)
          const [rgb, a] = val.split('/')
          const [r, g, b] = rgb.split(/ |,|, /)
          if (a) {
            value = `rgba(${r},${g},${b},${a})`
          } else {
            value = `rgb(${r},${g},${b})`
          }
        }
        if (value.endsWith('rem')) {
          value = value.replace(
            /(\d*\.?\d+)rem/g,
            (match, m1) => parseFloat(m1, 10) * 16 + 'px',
          )
        }
        const result = transform.default([[prop, value]])
        const classname = decl.parent.selector
          .slice(1)
          .replace('\\[', '[')
          .replace('\\]', ']')
          .replace('\\.', '.')
        if (!opts.cssObject[classname]) {
          opts.cssObject[classname] = result
        } else {
          Object.assign(opts.cssObject[classname], result)
        }
      }
    },
    /*
    Declaration: {
      color: (decl, postcss) {
        // The fastest way find Declaration node if you know property name
      }
    }
    */
  }
}

module.exports.postcss = true
