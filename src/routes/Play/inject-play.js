function __$hack() {
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
    // eslint-disable-next-line no-array-constructor
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
    const video = document.querySelector('video')

    const right = document.querySelector('.mplayer-right')
    if (!right || !video) {
      return
    }
    clearInterval(timer4)

    if (document.getElementById('download-button')) {
      return
    }
    const reloadBtn = document.createElement('div')
    reloadBtn.id = 'download-button'
    reloadBtn.innerHTML = '&#8659;'
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
  const element = document.body
  let startX = 0
  let startY = 0
  let distanceX = 0
  let distanceY = 0
  let direction = ''

  let touchTimer
  const isVideoPlaying = video =>
    !!(
      video.currentTime > 0 &&
      !video.paused &&
      !video.ended &&
      video.readyState > 2
    )

  element.addEventListener('touchstart', function (event) {
    touchTimer = setTimeout(function () {
      const video = document.querySelector('video')
      if (video && isVideoPlaying(video)) {
        video.playbackRate = 3
      }
    }, 1600)
    const touch = event.touches[0]
    startX = touch.clientX
    startY = touch.clientY
  })

  element.addEventListener('touchmove', function (event) {
    const touch = event.touches[0]
    distanceX = touch.clientX - startX
    distanceY = touch.clientY - startY
  })

  element.addEventListener('touchend', function () {
    clearTimeout(touchTimer)
    const video = document.querySelector('video')
    if (video) {
      video.playbackRate = 1
    }
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      direction = distanceX < 0 ? 'left' : 'right'
    } else {
      direction = distanceY < 0 ? 'up' : 'down'
    }
    const time1 = document
      .querySelector('.mplayer-time-current-text')
      ?.getBoundingClientRect()
    const time2 = document
      .querySelector('.mplayer-time-total-text')
      ?.getBoundingClientRect()

    if (time1 && time2 && video) {
      const { x: x1, y: y1 } = time1
      const { x: x2, y: y2 } = time2
      if (Math.abs(x1 - x2) < 5 && Math.abs(distanceY) > 70) {
        // fullscreen
        if (y1 > y2) {
          // up -> forward, down -> backward
          video.currentTime += direction === 'down' ? -5 : 5
        } else {
          video.currentTime += direction === 'up' ? -5 : 5
        }
      }
      if (Math.abs(y1 - y2) < 5) {
        if (x1 < x2) {
          if (
            !document.fullscreenElement &&
            (direction === 'down' || direction === 'up') &&
            Math.abs(distanceY) > 99
          ) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                action: 'change-video-height',
                payload: direction,
              }),
            )
          }
          if (
            (direction === 'left' || direction === 'right') &&
            Math.abs(distanceX) > 70
          ) {
            video.currentTime += direction === 'left' ? -5 : 5
          }
        } else {
          // TODO:
        }
      }
    }
    // if (!document.fullscreenElement) {
    //   if (
    //     (direction === 'down' || direction === 'up') &&
    //     Math.abs(distanceY) > 99
    //   ) {
    //     window.ReactNativeWebView.postMessage(
    //       JSON.stringify({
    //         action: 'change-video-height',
    //         payload: direction,
    //       }),
    //     )
    //   }
    //   if (
    //     (direction === 'left' || direction === 'right') &&
    //     Math.abs(distanceX) > 70
    //   ) {
    //     video.currentTime += direction === 'left' ? -5 : 5
    //   }
    // } else {
    // }

    startX = 0
    startY = 0
    distanceX = 0
    distanceY = 0
    direction = ''
  })
}

export const INJECTED_JAVASCRIPT = `(${__$hack})();true;`
