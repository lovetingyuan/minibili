function __$hack() {
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style')
    style.textContent = `
    body, #bilibiliPlayer, .mplayer {
      background-color: black!important;
    }
    .b-danmaku {
      opacity: 0.6!important;
    }
    `
    document.head.appendChild(style)
  })
  let videoUrl = ''
  const replacePlayUrl = () => {
    const video = document.querySelector('video')
    if (videoUrl && video.src !== videoUrl) {
      video.dataset.originUrl = video.src
      video.src = videoUrl
      video.load()
      setTimeout(() => {
        video.muted = false
        video.play()
      }, 10)
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
        video.currentTime = 0
        video.pause()
        replacePlayUrl()
      }
    },
    true,
  )
}

export const UPDATE_URL_CODE = `(${__$hack})();\ntrue;`
