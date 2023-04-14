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
    Array('ended', 'pause', 'waiting').forEach(evt => {
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
    const right = document.querySelector('.mplayer-right')
    if (!right) {
      return
    }
    clearInterval(timer4)
    const reloadBtn = document.createElement('div')
    reloadBtn.innerHTML = '&orarr;'
    reloadBtn.style.cssText = `
    width: 36px;
    height: 36px;
    color: white;
    font-size: 28px;
    text-align: center;
    transform: rotate(90deg);
    `
    reloadBtn.addEventListener('click', () => {
      window.location.reload()
    })
    right.appendChild(reloadBtn)
  }, 100)
  const timer5 = setInterval(() => {
    const poster = document.querySelector('img.mplayer-poster')
    if (poster && !poster.dataset.patched) {
      poster.dataset.patched = 'true'
      const image = poster.src
      // @ts-ignore
      poster.style.backdropFilter = 'blur(12px)'
      poster.style.objectFit = 'contain'
      if (poster.parentElement) {
        poster.parentElement.style.backgroundImage = 'url(' + image + ')'
      }
    }
  }, 100)
  setInterval(() => {
    const sss = Array.from(
      document.querySelectorAll('.mplayer-toast.mplayer-show'),
    )
    if (sss.length) {
      const failed = sss.findIndex(
        s =>
          s.querySelector('.mplayer-toast-text')?.innerText.trim() ===
          '播放失败',
      )
      if (failed !== -1) {
        const jump = sss[failed].querySelector('.mplayer-toast-jump')
        if (jump.innerText.trim() === '') {
          jump.innerHTML = '✕'
          jump.addEventListener('click', e => {
            e.preventDefault()
            jump.parentElement.classList.remove('mplayer-show')
          })
        }
      }
    }
  }, 1000)
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
    if (endY - startY > 100) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: 'change-video-height',
          payload: 'down',
        }),
      )
    } else if (endY - startY < -100) {
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
