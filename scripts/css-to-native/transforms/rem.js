'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.remToPx = void 0

var remToPx = function remToPx(value) {
  return value.replace(/(\d*\.?\d+)rem/g, function (match, m1) {
    return parseFloat(m1, 10) * 16 + 'px'
  })
}

exports.remToPx = remToPx
