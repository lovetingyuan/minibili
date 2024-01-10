'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.mediaQueryFeatures = exports.dimensionFeatures = void 0
var dimensionFeatures = ['width', 'height', 'device-width', 'device-height']
exports.dimensionFeatures = dimensionFeatures
var mediaQueryFeatures = [
  'orientation',
  'scan',
  'resolution',
  'aspect-ratio',
  'device-aspect-ratio',
  'grid',
  'color',
  'color-index',
  'monochrome',
].concat(dimensionFeatures)
exports.mediaQueryFeatures = mediaQueryFeatures
