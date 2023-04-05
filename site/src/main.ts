import './style.css'
import he from 'he'
import { nanoid } from 'nanoid'

const eventsMap: Record<string, boolean> = {}

// @ts-ignore
window._events = {
  on(name: string, callback: () => void) {
    if (name in eventsMap) {
      return
    }
    eventsMap[name] = true
    window.addEventListener(name, callback)
  },
  emit(name: string) {
    window.dispatchEvent(new CustomEvent(name))
  },
}

const elements = import.meta.glob('./elements/*.html', {
  eager: true,
  import: 'default',
  as: 'raw',
})

const domparser = new DOMParser()

Object.keys(elements).forEach(path => {
  const tag = path.slice('./elements/'.length, -5)
  customElements.define(
    tag,
    class extends HTMLElement {
      render: () => void
      scriptCode: string
      template: string
      shadowRoot: ShadowRoot
      constructor() {
        super()
        // const template = document.createElement('template')
        const doc = domparser.parseFromString(elements[path], 'text/html')
        const script = doc.querySelector('script')
        this.scriptCode = script?.textContent || ''
        script?.remove()
        const eventsCode: string[] = []
        Array.from(doc.querySelectorAll('[onclick]')).forEach(el => {
          console.log(el)
          const handler = el.getAttribute('onclick')
          const id = 'event_' + nanoid(6)
          eventsCode.push(`
          const ${id} = () => { ${handler} }
          _events.on("${id}", ${id})
          `)
          el.setAttribute('onclick', `_events.emit('${id}')`)
        })
        this.scriptCode += eventsCode.join('')
        this.template = he.unescape(doc.body.innerHTML)
        // script?.remove()
        // console.log(11, doc.body.innerHTML.includes('<script>'))
        // template.innerHTML = doc.body.innerHTML
        this.render = () => ''
        this.shadowRoot = this.attachShadow({ mode: 'open' })
        // const node = template.content.cloneNode(true)
        // console.log(22, doc.body)
        // doc.body.chil
        // this.shadowRoot.appendChild(doc.body)
      }
      connectedCallback() {
        // @ts-ignore
        const render =
          // eslint-disable-next-line no-new-func
          new Function(`
          return (async () => {
            ${this.scriptCode};
            return () => \`${this.template}\`
          })()
          `)
        const context = {
          update: this.render,
        }
        render.call(context).then((getHtml: () => string) => {
          this.render = () => {
            this.shadowRoot.innerHTML = getHtml()
          }
          this.render()
        })
      }
      attributeChangedCallback() {
        this.render()
      }
    },
  )
})
