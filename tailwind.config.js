const transform = require('./scripts/css-to-native')
const path = require('path')
const fs = require('fs')
const postcss = require('postcss')
const cssvariables = require('postcss-css-variables')

const outputcss = path.resolve(__dirname, 'node_modules/tailwindcss/output.css')
if (!fs.existsSync(outputcss)) {
  fs.writeFileSync(outputcss, '')
}
const stylefile = path.resolve(__dirname, 'src/styles.ts')
const regex = /\/\*\* start \*\/([\s\S]*?)\/\*\* end \*\//

fs.watch(outputcss, eventType => {
  if (eventType === 'change') {
    const css = fs.readFileSync(outputcss, 'utf-8')

    // Process your CSS with postcss-css-variables
    const output = postcss([cssvariables(/*options*/)]).process(css).css

    // console.log(11, output)
    const stylesheet = transform.default(output, {
      ignoreRule(s) {
        if (s === '.transform') {
          return true
        }
      },
    })
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
  content: {
    files: ['src/**/*.tsx'],
    extract: {
      tsx: content => {
        const regex = /s\.[i|v|t]\('([^']+)'\)/g
        const matches = content.match(regex) || []

        const strings = matches
          .map(match => match.substring(5, match.length - 2))
          .filter(s => /[a-z]/.test(s[0]))
          .map(v => v.split(' '))
          .flat()
        // strings.length && console.log(44, strings)
        return strings
      },
    },
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
