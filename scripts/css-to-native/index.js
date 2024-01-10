'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.default = void 0

var _cssMediaquery = _interopRequireDefault(require('css-mediaquery'))

var _cssToReactNative = _interopRequireDefault(require('css-to-react-native'))

var _parse = _interopRequireDefault(require('css/lib/parse'))

var _features = require('./transforms/media-queries/features')

var _types = require('./transforms/media-queries/types')

var _rem = require('./transforms/rem')

var _allEqual = require('./utils/allEqual')

var _camelCase = require('./utils/camelCase')

var _sortRules = require('./utils/sortRules')

var _values = require('./utils/values')

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

var lengthRe = /^(0$|(?:[+-]?(?:\d*\.)?\d+(?:[Ee][+-]?\d+)?)(?=px|rem$))/
var viewportUnitRe = /^([+-]?[0-9.]+)(vh|vw|vmin|vmax)$/
var percentRe = /^([+-]?(?:\d*\.)?\d+(?:[Ee][+-]?\d+)?%)$/
var unsupportedUnitRe =
  /^([+-]?(?:\d*\.)?\d+(?:[Ee][+-]?\d+)?(ch|em|ex|cm|mm|in|pc|pt))$/
var shorthandBorderProps = [
  'border-radius',
  'border-width',
  'border-color',
  'border-style',
]

var transformDecls = function transformDecls(styles, declarations, result) {
  for (var d in declarations) {
    var declaration = declarations[d]
    if (declaration.type !== 'declaration') {
      continue
    }
    var property = declaration.property
    var value = (0, _rem.remToPx)(declaration.value)
    var isLengthUnit = lengthRe.test(value)
    var isViewportUnit = viewportUnitRe.test(value)
    var isPercent = percentRe.test(value)
    var isUnsupportedUnit = unsupportedUnitRe.test(value)

    if (
      property === 'line-height' &&
      !isLengthUnit &&
      !isViewportUnit &&
      !isPercent &&
      !isUnsupportedUnit
    ) {
      throw new Error(
        'Failed to parse declaration "'
          .concat(property, ': ')
          .concat(value, '"'),
      )
    }

    if (!result.__viewportUnits && isViewportUnit) {
      result.__viewportUnits = true
    }

    if (shorthandBorderProps.indexOf(property) > -1) {
      // transform single value shorthand border properties back to
      // shorthand form to support styling `Image`.
      var transformed = (0, _cssToReactNative.default)([[property, value]])
      var vals = (0, _values.values)(transformed)

      if ((0, _allEqual.allEqual)(vals)) {
        var replacement = {}
        replacement[(0, _camelCase.camelCase)(property)] = vals[0]
        Object.assign(styles, replacement)
      } else {
        Object.assign(styles, transformed)
      }
    } else {
      Object.assign(styles, (0, _cssToReactNative.default)([[property, value]]))
    }
  }
}

var transform = function transform(css, options) {
  var _parseCSS = (0, _parse.default)(css),
    stylesheet = _parseCSS.stylesheet

  var rules = (0, _sortRules.sortRules)(stylesheet.rules)
  var result = {}

  for (var r in rules) {
    var rule = rules[r]

    for (var s in rule.selectors) {
      if (rule.selectors[s] === ':export') {
        if (!result.__exportProps) {
          result.__exportProps = {}
        }

        rule.declarations.forEach(function (_ref) {
          var property = _ref.property,
            value = _ref.value
          var isAlreadyDefinedAsClass =
            result[property] !== undefined &&
            result.__exportProps[property] === undefined

          if (isAlreadyDefinedAsClass) {
            throw new Error(
              'Failed to parse :export block because a CSS class in the same file is already using the name "'.concat(
                property,
                '"',
              ),
            )
          }

          result.__exportProps[property] = value
        })
        continue
      }

      if (
        rule.selectors[s].indexOf('.') !== 0 ||
        rule.selectors[s].indexOf(':') !== -1 ||
        // rule.selectors[s].indexOf('[') !== -1 ||
        rule.selectors[s].indexOf('~') !== -1 ||
        rule.selectors[s].indexOf('>') !== -1 ||
        rule.selectors[s].indexOf('+') !== -1 ||
        rule.selectors[s].indexOf(' ') !== -1
      ) {
        continue
      }
      if (options?.ignoreRule?.(rule.selectors[s])) {
        continue
      }

      var selector = rule.selectors[s].replace(/^\./, '')
      var styles = (result[selector] = result[selector] || {})
      transformDecls(styles, rule.declarations, result)
    }

    if (
      rule.type == 'media' &&
      options != null &&
      options.parseMediaQueries === true
    ) {
      var parsed = _cssMediaquery.default.parse(rule.media)

      parsed.forEach(function (mq) {
        if (_types.mediaQueryTypes.indexOf(mq.type) === -1) {
          throw new Error(
            'Failed to parse media query type "'.concat(mq.type, '"'),
          )
        }

        mq.expressions.forEach(function (e) {
          var mf = e.modifier
            ? ''.concat(e.modifier, '-').concat(e.feature)
            : e.feature
          var val = e.value ? ': '.concat(e.value) : ''

          if (_features.mediaQueryFeatures.indexOf(e.feature) === -1) {
            throw new Error(
              'Failed to parse media query feature "'.concat(mf, '"'),
            )
          }

          if (
            _features.dimensionFeatures.indexOf(e.feature) > -1 &&
            lengthRe.test(e.value) === false
          ) {
            throw new Error(
              'Failed to parse media query expression "('
                .concat(mf)
                .concat(val, ')"'),
            )
          }
        })
      })
      var media = '@media ' + rule.media
      result.__mediaQueries = result.__mediaQueries || {}
      result.__mediaQueries[media] = parsed

      for (var _r in rule.rules) {
        var ruleRule = rule.rules[_r]

        for (var _s in ruleRule.selectors) {
          result[media] = result[media] || {}

          var _selector = ruleRule.selectors[_s].replace(/^\./, '')

          var mediaStyles = (result[media][_selector] =
            result[media][_selector] || {})
          transformDecls(mediaStyles, ruleRule.declarations, result)
        }
      }
    }
  }

  if (result.__exportProps) {
    Object.assign(result, result.__exportProps)
    delete result.__exportProps
  }

  return result
}

var _default = transform
exports.default = _default
