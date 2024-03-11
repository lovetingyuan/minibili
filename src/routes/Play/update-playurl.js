function __$hack() {
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
