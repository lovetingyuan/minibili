'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.mediaQueryTypes =
  exports.reactNativeMediaQueryTypes =
  exports.cssnextMediaQueryTypes =
  exports.defaultTypes =
    void 0
var defaultTypes = [
  'all',
  'braille',
  'embossed',
  'handheld',
  'print',
  'projection',
  'screen',
  'speech',
  'tty',
  'tv',
]
exports.defaultTypes = defaultTypes
var cssnextMediaQueryTypes = ['pointer', 'hover', 'block-overflow']
exports.cssnextMediaQueryTypes = cssnextMediaQueryTypes
var reactNativeMediaQueryTypes = [
  'android',
  'dom',
  'ios',
  'macos',
  'web',
  'windows',
]
exports.reactNativeMediaQueryTypes = reactNativeMediaQueryTypes
var mediaQueryTypes = defaultTypes
  .concat(cssnextMediaQueryTypes)
  .concat(reactNativeMediaQueryTypes)
exports.mediaQueryTypes = mediaQueryTypes
