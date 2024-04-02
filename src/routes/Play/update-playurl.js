function __$hack() {
  const createElement = document.createElement
  const style = document.createElement('style')
  style.textContent = `
  body[data-replaced] .mplayer-time-total-text {
    font-weight: bold!important;
    font-size: 14px!important;
  }
  `
  document.head.appendChild(style)
  document.createElement = function _createElement(name, options) {
    const ele = createElement.call(this, name, options)
    if (name === 'video') {
      Promise.resolve().then(() => {
        if (ele.src) {
          // ele.dataset.originSrc = ele.src
          // ele.setAttribute('muted', 'false')
          // ele.setAttribute('autoplay', 'false')
          if (window.newVideoUrl && ele.src !== window.newVideoUrl) {
            ele.setAttribute('src', window.newVideoUrl)
            ele.dataset.replaced = 'true'
            if (window.newVideoUrl.includes('_high_quality')) {
              document.body.dataset.replaced = 'true'
            }
            ele.setAttribute('autoplay', 'true')
            ele.addEventListener('canplay', () => {
              requestAnimationFrame(() => {
                if (document.body.contains(ele)) {
                  ele.play()
                }
              })
            })
          }
        }
      })
    }
    return ele
  }

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      action: 'updateUrlSettled',
      payload: '',
    }),
  )
}

export const UPDATE_URL_CODE = `(${__$hack})();\ntrue;`
