function __$hack() {
  let videoDom
  const timer2 = setInterval(() => {
    const dom = document.querySelector('.mplayer-display')
    if (dom) {
      clearInterval(timer2)
      dom.ondblclick = () => {
        const video = document.querySelector('video')
        if (video && !video.paused) {
          video.pause()
        }
      }
    }
  }, 200)
  const timer3 = setInterval(() => {
    const video = document.querySelector('video')
    if (!video) {
      return
    }
    videoDom = video
    clearInterval(timer3)
    const postPlayState = state => {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: 'playState',
          payload: state,
        }),
      )
    }
    video.addEventListener('play', () => {
      postPlayState('play')
    })
    ;['ended', 'pause', 'waiting'].forEach(evt => {
      video.addEventListener(evt, () => {
        postPlayState(evt)
        if (evt === 'ended') {
          if (document.exitFullscreen) {
            document.exitFullscreen()
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen() // Firefox
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen() // Chrome, Safari & Opera
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen() // IE/Edge
          }
        }
      })
    })
    postPlayState(video.paused ? 'pause' : 'play')
  }, 200)
  const timer4 = setInterval(() => {
    const video = document.querySelector('video')

    const right = document.querySelector('.mplayer-right')
    if (!right || !video) {
      return
    }
    clearInterval(timer4)
    if (right.querySelector('#download-button')) {
      return
    }
    const reloadBtn = document.createElement('div')
    reloadBtn.id = 'download-button'
    reloadBtn.innerHTML = '⇓'
    reloadBtn.style.cssText = `
    width: 24px;
    height: 24px;
    color: white;
    font-size: 28px;
    line-height: 24px;
    text-align: center;
    background: rgba(0,0,0,.2);
    border-radius: 50%;
    `
    reloadBtn.addEventListener('click', () => {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: 'downloadVideo',
          payload: video.src,
        }),
      )
    })
    right.appendChild(reloadBtn)
  }, 100)
  const timer5 = setInterval(() => {
    const poster = document.querySelector('img.mplayer-poster')
    if (poster && !poster.dataset.patched) {
      poster.dataset.patched = 'true'
      const image = poster.src
      poster.style.backdropFilter = 'blur(12px)'
      poster.style.objectFit = 'contain'
      if (poster.parentElement) {
        poster.parentElement.style.backgroundImage = 'url(' + image + ')'
      }
    }
  }, 100)
  setTimeout(() => {
    clearInterval(timer2)
    clearInterval(timer3)
    clearInterval(timer4)
    clearInterval(timer5)
  }, 4000)
  let startY
  let endY
  document.addEventListener('touchstart', function (e) {
    startY = e.touches[0].clientY
  })

  document.addEventListener('touchmove', function (e) {
    endY = e.touches[0].clientY
    if (videoDom && videoDom.ended) {
      return
    }
    if (endY - startY > 99) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: 'change-video-height',
          payload: 'down',
        }),
      )
    } else if (endY - startY < -99) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: 'change-video-height',
          payload: 'up',
        }),
      )
    }
  })
}

export const INJECTED_JAVASCRIPT = `(${__$hack})();true;`
