const transform = require('css-to-react-native-transform')
const path = require('path')
const fs = require('fs')

const outputcss = path.resolve(__dirname, 'node_modules/tailwindcss/output.css')
if (!fs.existsSync(outputcss)) {
  fs.writeFileSync(outputcss, '')
}
const stylefile = path.resolve(__dirname, 'src/styles.ts')
const regex = /\/\*\* start \*\/([\s\S]*?)\/\*\* end \*\//

fs.watch(outputcss, eventType => {
  if (eventType === 'change') {
    const css = fs.readFileSync(outputcss, 'utf-8')
    const stylesheet = transform.default(css)
    const styles = fs.readFileSync(stylefile, 'utf-8')

    fs.writeFileSync(
      stylefile,
      styles.replace(
        regex,
        `/** start */\n${JSON.stringify(stylesheet, null, 2)}\n/** end */`,
      ),
    )
  }
})

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.tsx'],
  theme: {
    extend: {},
  },
  plugins: [],
}
