import transform from './index.js'

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

console.log(stylesheet, {
  'text-\\[17px\\]': {
    fontSize: 17,
  },
})
