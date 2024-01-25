const transform = require('css-to-react-native')
const { prop, value } = {
  prop: 'transform',
  value: 'translate(0) rotate(0) skewX(0) skewY(0) scaleX(1.5) scaleY(1.5)',
}
value.split(' ').map(v => {
  const result = transform.default([[prop, v]])
  console.log(result)
})
// const result = transform.default([[prop, value]])
// console.log(result)

/**
 *     throw new Error("Failed to parse declaration \"" + propName + ": " + value + "\"");
    ^

Error: Failed to parse declaration "transform: translate(0) rotate(0) skewX(0) skewY(0) scaleX(1.5) scaleY(1.5)"
    at transformShorthandValue (/Users/tingyuan/Documents/lovetingyuan/minibili/node_modules/css-to-react-native/index.js:847:11)
    at getStylesForProperty (/Users/tingyuan/Documents/lovetingyuan/minibili/node_modules/css-to-react-native/index.js:856:109)
    at /Users/tingyuan/Documents/lovetingyuan/minibili/node_modules/css-to-react-native/index.js:879:33
    at Array.reduce (<anonymous>)
    at Object.index [as default] (/Users/tingyuan/Documents/lovetingyuan/minibili/node_modules/css-to-react-native/index.js:875:16)
    at Object.<anonymous> (/Users/tingyuan/Documents/lovetingyuan/minibili/a.js:6:33)
    at Module._compile (node:internal/modules/cjs/loader:1256:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1310:10)
    at Module.load (node:internal/modules/cjs/loader:1119:32)
    at Module._load (node:internal/modules/cjs/loader:960:12)

Node.js v18.17.1
 */
