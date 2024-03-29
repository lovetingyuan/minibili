function __$hack() {
  let videoUrl = ''
  const replacePlayUrl = () => {
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
      video.currentTime = 0
      video.pause()
      video.dataset.originUrl = video.src
      video.src = videoUrl
      const style = document.createElement('style')
      style.textContent = `
      .mplayer-time-total-text {
        font-weight: bold!important;
        font-size: 14px!important;
      }
      `
      document.head.appendChild(style)
      // alert(videoUrl)
      // window.ReactNativeWebView.postMessage(
      //   JSON.stringify({
      //     action: 'console.log',
      //     payload: 'current url: ' + videoUrl,
      //   }),
      // )
      video.load()
      // setTimeout(() => {
      video.muted = false
      video.play()
      // }, 10)
    }
  }
  window.setNewVideoUrl = function (url) {
    videoUrl = url
    replacePlayUrl()
  }
  document.addEventListener(
    'loadstart',
    evt => {
      const video = evt.target
      if (video && video.tagName === 'VIDEO') {
        video.pause()
        replacePlayUrl()
      }
    },
    true,
  )
}

export const UPDATE_URL_CODE = `(${__$hack})();\ntrue;`
