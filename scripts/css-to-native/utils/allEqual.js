'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.allEqual = void 0

var allEqual = function allEqual(arr) {
  return arr.every(function (v) {
    return v === arr[0]
  })
}

exports.allEqual = allEqual
