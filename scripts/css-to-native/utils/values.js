'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.values = void 0

var values = function values(obj) {
  return Object.keys(obj).map(function (key) {
    return obj[key]
  })
}

exports.values = values
