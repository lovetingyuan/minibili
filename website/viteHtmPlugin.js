import { parse } from '@vue/compiler-sfc'
import { minify } from 'html-minifier-terser'

function minifyHtml(template) {
  const defaultMinifyOptions = {
    caseSensitive: true,
    minifyCSS: true,
    minifyJS: false,
    collapseWhitespace: true,
    // collapseInlineTagWhitespace: true,
    // conservativeCollapse: true,
    keepClosingSlash: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
  }
  return minify(template, defaultMinifyOptions)
}

async function transformHtm(code, url, isBuild) {
  const componentName = url.split('/').pop().split('.').shift()
  const scopeName = `${componentName.replace(/-/g, '_')}$`
  if (!code.includes('<script ') && !code.includes('</script>')) {
    code = code + '\n<script>/**/</script>'
  }
  const { descriptor, errors } = parse(code)
  if (errors.length) {
    errors.forEach((err) => {
      this.error(`component "${componentName}" has errors: ${err.message}`)
    })
    return `throw new Error("${componentName} has compiler error")`
  }
  const scriptContent = descriptor.script?.content.trim() ?? ''
  const hasStyle = descriptor.styles.length > 0
  const stylesContent = descriptor.styles.map((s) => s.content).join('\n')
  if (descriptor.customBlocks.length > 1) {
    const msg = `component "${componentName}" can only contain one single root element`
    this.error(msg)
    return `throw new Error(${JSON.stringify(msg)})`
  }
  if (!descriptor.customBlocks.length) {
    const msg = `component "${componentName}" must contain one single root element`
    this.error(msg)
    return `throw new Error(${JSON.stringify(msg)})`
  }
  const [rootElement] = descriptor.customBlocks
  const dataScopeCode = `
import Alpine from 'alpinejs'
Alpine.data("${scopeName}", function () {
  const scope = typeof setup === 'function' ? setup.call(this) : {}
  return scope
})
  `
  const template = isBuild
    ? await minifyHtml(rootElement.content)
    : rootElement.content
  const templateCode = `
const __template = document.createElement("${rootElement.type}")
__template.setAttribute('x-data', "${scopeName}")
Object.entries(${JSON.stringify(rootElement.attrs)}).forEach(([k, v]) => {
  __template.setAttribute(k, v)
})
__template.innerHTML = ${JSON.stringify(template)}

const __style = document.createElement('style')
__style.textContent = ${JSON.stringify(stylesContent)}
  `
  const componentCode = `
if (customElements.get("${componentName}")) {
  throw new Error('"${componentName}" has been registered, the file name should be unique.')
}
customElements.define(
  "${componentName}",
  class extends HTMLElement {
    static observedAttributes = []
    static componentName = "${componentName}"
    static type = 'alpine'
    constructor() {
      super()
    }
    connectedCallback() {
      this.appendChild(__template.cloneNode(true))
      ${hasStyle} && this.appendChild(__style.cloneNode(true))
    }

    disconnectedCallback() {
      Alpine.destroyTree(this)
    }

    adoptedCallback() {}

    attributeChangedCallback() {}
  }
)
`
  return `
${scriptContent}
${dataScopeCode}
${templateCode}
${componentCode}
`.trim()
}

function start() {
  // eslint-disable-next-line no-undef
  Alpine.directive(
    'props',
    (
      el,
      { value, modifiers, expression },
      { Alpine, effect, cleanup, evaluate, evaluateLater },
    ) => {
      if (el.constructor.type !== 'alpine') {
        return
      }
      const getProps = evaluateLater(expression)

      effect(() => {
        let props
        getProps((p) => {
          if (props) {
            Object.assign(props, p)
          } else {
            props = p
          }
          const scopes = el.firstElementChild._x_dataStack
          if (scopes && scopes[0] && typeof scopes[0].props === 'function') {
            scopes[0].props(props)
          }
        })
      })
    },
  )
  // eslint-disable-next-line no-undef
  Alpine.start()
}

export default function htmPlugin() {
  const virtualModuleId = 'virtual:alpine'
  const resolvedVirtualModuleId = '\0' + virtualModuleId
  let isBuild
  return {
    name: 'htm-alpine-plugin',
    configResolved(config) {
      isBuild = config.command === 'build'
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return [
          "import Alpine from 'alpinejs'",
          'export default ' + start.toString(),
        ].join('\n')
      }
    },
    transform(code, id) {
      if (id.endsWith('.htm')) {
        return transformHtm.call(this, code, id, isBuild)
      }
    },
  }
}
