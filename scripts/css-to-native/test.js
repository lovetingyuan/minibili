const transform = require('./index')

const stylesheet = transform(
  `
  [sf] {
    color: 'red'
  }
.text-\[17px\] {
  font-size: 17px;
}
`,
  {
    ignoreRule(s) {
      if (s === '.transform') {
        return true
      }
    },
  },
)

// eslint-disable-next-line no-console
console.log(stylesheet, {
  'text-\\[17px\\]': {
    fontSize: 17,
  },
})
