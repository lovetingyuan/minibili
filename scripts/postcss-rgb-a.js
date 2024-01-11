const postcss = require('postcss')

// color: rgb(52 211 153 / 1);
// -->
// color: rgb(52, 211, 153, 1);

module.exports = postcss.plugin('convert-rgb-to-rgba', () => {
  return root => {
    root.walkDecls(decl => {
      if (decl.value.includes('rgb(')) {
        const newValue = decl.value.replace(
          /rgb\((.*?)\s*\/\s*(.*?)\)/g,
          (match, color, alpha) => {
            const rgbValues = color.split(' ').map(value => value.trim())
            const rgbaValue = `rgba(${rgbValues.join(', ')}, ${alpha})`
            return rgbaValue
          },
        )
        decl.value = newValue.replace(/\s*,\s*/g, ', ')
      }
    })
  }
})
