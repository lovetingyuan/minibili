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
          ele.dataset.src = ele.src
          const newVideoUrl = 'NewVideoUrl'
          ele.setAttribute('autoplay', 'true')
          ele.setAttribute('src', newVideoUrl)
          ele.dataset.replaced = 'true'
          if (newVideoUrl.includes('_high_quality')) {
            document.body.dataset.replaced = 'true'
          }
        }
      })
    }
    return ele
  }

  // window.ReactNativeWebView.postMessage(
  //   JSON.stringify({
  //     action: 'updateUrlSettled',
  //     payload: '',
  //   }),
  // )
}

export const UPDATE_URL_CODE = `(${__$hack})();\ntrue;`
