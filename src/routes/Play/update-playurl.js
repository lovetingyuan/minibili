function __$hack() {
  let requestId
  function executeMethod() {
    const video = document.querySelector('video')
    const videoUrl = window.__newVideoUrl
    if (video) {
      video.addEventListener('loadedmetadata', function () {
        video.muted = false
        video.play()
      })
      video.pause()
      video.autoplay = false
    }
    if (video && videoUrl) {
      cancelAnimationFrame(requestId)
      if (video.src === videoUrl) {
        return
      }
      video.pause()
      // alert(video.src)
      video.dataset.originUrl = video.src
      // video.src = video.src.replace('qn=32', 'qn=64')
      video.src = videoUrl
      video.load()
      setTimeout(() => {
        video.muted = false
        video.play()
      }, 10)
      return
    }
    requestId = requestAnimationFrame(executeMethod)
  }
  requestId = requestAnimationFrame(executeMethod)
}

export const UPDATE_URL_CODE = `(${__$hack})();\ntrue;`
