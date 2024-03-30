function __$hack() {
  const createElement = document.createElement
  const style = document.createElement('style')
  style.textContent = `
  .mplayer-time-total-text {
    font-weight: bold!important;
    font-size: 14px!important;
  }
  `
  document.createElement = function _createElement(name, options) {
    const ele = createElement.call(this, name, options)
    if (name === 'video') {
      Promise.resolve().then(() => {
        if (ele.src) {
          ele.removeAttribute('src')
          ele.setAttribute('autoplay', 'false')
          ele.setAttribute('muted', 'false')
        }
      })
    }
    return ele
  }

  window.setNewVideoUrl = videoUrl => {
    const video = document.querySelector('video')
    // window.ReactNativeWebView.postMessage(
    //   JSON.stringify({
    //     action: 'console.log',
    //     payload: `
    //     ${video.src}
    //     -----
    //     ${videoUrl}
    //     `,
    //   }),
    // )
    if (videoUrl && video.src !== videoUrl) {
      video.src = videoUrl
      document.head.appendChild(style)
      // alert(videoUrl)
      video.load()
      setTimeout(() => {
        video.muted = false
        video.play()
      })
    }
  }
}

export const UPDATE_URL_CODE = `(${__$hack})();\ntrue;`
