export default function getTemplate(
  template: string,
  context: Record<string, any>,
) {
  // eslint-disable-next-line no-new-func
  const templateFn = new Function(
    ...Object.keys(context),
    `return \`${template.trim()}\``,
  )
  return (container: HTMLElement | string) => {
    const html = templateFn(...Object.values(context))
    let _container: HTMLElement | null
    if (typeof container === 'string') {
      _container = document.querySelector(container)
    } else {
      _container = container
    }
    if (_container) {
      _container.innerHTML = html
    } else {
      throw new Error('can not find mount container')
    }
  }
}
