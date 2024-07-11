function __$hack() {
  const style = document.createElement('style')
  style.textContent = `
  body[data-replaced] .mplayer-time-total-text {
    font-weight: bold!important;
    font-size: 14px!important;
  }
  `
  const newVideoUrl = decodeURIComponent(window.location.hash.slice(1))
  document.head.appendChild(style)

  // eslint-disable-next-line no-undef
  const seta = HTMLElement.prototype.setAttribute
  // eslint-disable-next-line no-undef
  HTMLElement.prototype.setAttribute = function (...args) {
    if (this.tagName === 'VIDEO' && this.src !== newVideoUrl) {
      Promise.resolve().then(() => {
        this.src = newVideoUrl
      })
    }
    return seta.apply(this, args)
  }
  function waitForVideo(callback) {
    const video = document.querySelector('video[src]')
    if (video) {
      callback(video)
    } else {
      document.addEventListener(
        'loadstart',
        (evt) => {
          if (evt.target && evt.target.tagName === 'VIDEO' && evt.target.src) {
            callback(evt.target)
          }
        },
        true,
      )
    }
  }
  function waitForDom(selectors, callback) {
    if (typeof selectors === 'string') {
      selectors = [selectors]
    }
    const fn = () => {
      const doms = selectors
        .map((s) => document.querySelector(s))
        .filter(Boolean)
      if (doms.length === selectors.length) {
        clearInterval(timer)
        callback(...doms)
      }
    }
    const timer = setInterval(fn, 200)
    fn()
    setTimeout(() => {
      clearInterval(timer)
    }, 10000)
  }
  waitForVideo((video) => {
    if (video.__handled) {
      return
    }
    video.__handled = true
    // eslint-disable-next-line no-array-constructor
    Array('play', 'ended', 'pause').forEach((evt) => {
      video.addEventListener(evt, () => {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            action: 'playState',
            payload: evt,
          }),
        )
      })
    })

    video.addEventListener('ended', () => {
      const rateBtn = document.getElementById('play-rate-button')
      rateBtn.dataset.rate = `1${xx}`
      rateBtn.textContent = 1 + xx
      video.playbackRate = 1
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen() // Firefox
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen() // Chrome, Safari & Opera
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen() // IE/Edge
      }
    })
    let watchedTime = 0
    let lastTime = 0 // Last time update position

    video.addEventListener('timeupdate', () => {
      const currentTime = video.currentTime
      // Add the time difference if it's a regular playback or a small skip (less than 2 seconds)
      if (currentTime - lastTime < 2 && currentTime > lastTime) {
        watchedTime += currentTime - lastTime
      }
      lastTime = currentTime
    })

    video.addEventListener('seeking', () => {
      // Update lastTime to current time when user seeks
      lastTime = video.currentTime
    })

    video.addEventListener('ended', () => {
      window.reportPlayTime()
    })
    window.reportPlayTime = () => {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: 'reportPlayTime',
          payload: Number.parseFloat(
            ((watchedTime * 100) / video.duration).toFixed(1),
          ),
        }),
      )
    }
    const fixStyle = document.createElement('style')
    fixStyle.textContent = `
    html, body, #bilibiliPlayer, .mplayer {
      background-color: black!important;
    }
    .b-danmaku {
      opacity: 0.66!important;
    }
    .mplayer-control-bar-top {
      align-items: center;
    }
    `
    document.head.appendChild(fixStyle)
  })

  // waitForVideo((vi) => {
  //   if (vi && newVideoUrl.startsWith('https') && vi.src !== newVideoUrl) {
  //     vi.dataset.src = vi.src
  //     vi.setAttribute('autoplay', 'true')
  //     vi.setAttribute('src', newVideoUrl)
  //     vi.dataset.replaced = 'true'
  //     setTimeout(() => {
  //       vi.play()
  //     }, 500)
  //     setTimeout(() => {
  //       const _vi = document.querySelector('video[data-replaced]')
  //       if (_vi && newVideoUrl.includes('_high_quality') && document.body) {
  //         document.body.dataset.replaced = 'true'
  //       }
  //     }, 3000)
  //   }
  // })

  const xx = 'x'
  waitForDom('.mplayer-display', (container) => {
    container.addEventListener('dblclick', (evt) => {
      if (evt.target.matches('.mplayer-right *')) {
        return
      }
      const video = document.querySelector('video[src]')
      if (!video) {
        return
      }
      const paused = video.paused
      if (paused) {
        video.play()
      } else {
        video.pause()
      }
    })
  })
  waitForDom('.mplayer-right', (right) => {
    if (!document.getElementById('play-rate-button')) {
      const rateBtn = document.createElement('div')
      rateBtn.id = 'play-rate-button'
      rateBtn.innerHTML = `1${xx}`
      rateBtn.dataset.rate = '1'
      rateBtn.style.cssText = `
        width: 24px;
        height: 24px;
        color: white;
        font-size: 16px;
        line-height: 28px;
        text-align: center;
        background: rgba(0,0,0,.2);
        border-radius: 50%;
      `
      rateBtn.addEventListener('click', () => {
        const video = document.querySelector('video')
        if (!video) {
          return
        }
        let rate = rateBtn.dataset.rate - 0
        if (rate === 1) {
          rate = 2
        } else if (rate === 2) {
          rate = 3
        } else if (rate === 3) {
          rate = 5
        } else if (rate === 5) {
          rate = 1
        }
        rateBtn.dataset.rate = rate
        rateBtn.textContent = rate + xx
        video.playbackRate = rate
      })
      right.appendChild(rateBtn)
    }
  })

  const element = document.body
  let startX = 0
  let startY = 0
  let distanceX = 0
  let distanceY = 0
  let direction = ''

  let touchTimer
  const isVideoPlaying = (video) =>
    !!(
      video.currentTime > 0 &&
      !video.paused &&
      !video.ended &&
      video.readyState > 2
    )

  element.addEventListener('touchstart', (event) => {
    touchTimer = setTimeout(() => {
      const video = document.querySelector('video')
      if (video && isVideoPlaying(video)) {
        video.playbackRate = 3
        video.dataset.longPress = 'true'
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            action: 'showToast',
            payload: '3倍速播放',
          }),
        )
      }
    }, 1000)
    const touch = event.touches[0]
    startX = touch.clientX
    startY = touch.clientY
  })

  element.addEventListener('touchmove', (event) => {
    const touch = event.touches[0]
    distanceX = touch.clientX - startX
    distanceY = touch.clientY - startY
  })

  element.addEventListener('touchend', () => {
    clearTimeout(touchTimer)
    const video = document.querySelector('video')
    if (video && video.dataset.longPress === 'true') {
      video.playbackRate = 1
      video.dataset.longPress = 'false'
      const rateBtn = document.getElementById('play-rate-button')
      if (rateBtn) {
        rateBtn.dataset.rate = '1'
        rateBtn.textContent = `1${xx}`
      }
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

    startX = 0
    startY = 0
    distanceX = 0
    distanceY = 0
    direction = ''
  })
}

export const INJECTED_JAVASCRIPT = `(${__$hack})();\ntrue;`
