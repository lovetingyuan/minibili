import './style.css'

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
      render: () => Promise<string>
      script: string
      template: string
      shadowRoot: ShadowRoot
      constructor() {
        super()
        const template = document.createElement('template')
        const doc = domparser.parseFromString(elements[path], 'text/html')
        const script = doc.querySelector('script')
        this.script = script?.textContent || ''
        this.template = elements[path]
        // script?.remove()
        template.innerHTML = this.template
        this.render = () => Promise.resolve('')
        this.shadowRoot = this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(template.content.cloneNode(true))
      }
      connectedCallback() {
        // @ts-ignore
        this.render =
          // eslint-disable-next-line no-new-func
          new Function(`
          return (async () => {
            ${this.script};
            return \`${elements[path].trim()}\`
          })()
          `)
        this.render.call({}).then(html => {
          this.shadowRoot.innerHTML = html
        })
      }
    },
  )
})
