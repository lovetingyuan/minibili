function __$hack() {
  let requestId
  // const rawPlay = HTMLMediaElement.prototype.play
  // window.aa = new Set()
  // setTimeout(() => {
  //   alert([...aa].length)
  // }, 10000)
  // HTMLMediaElement.prototype.play = function () {
  //   // alert(this.src)
  //   aa.add(this)

  //   return rawPlay.call(this)
  // }
  function executeMethod() {
    const video = document.querySelector('video')
    const videoUrl = window.__newVideoUrl
    if (video) {
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
      // setTimeout(() => {
      video.muted = false
      video.play()
      // }, 100)
      return
    }
    requestId = requestAnimationFrame(executeMethod)
  }
  requestId = requestAnimationFrame(executeMethod)
}

export const UPDATE_URL_CODE = `(${__$hack})();\ntrue;`
