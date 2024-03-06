function __$hack() {
  function waitForDom(selectors, callback) {
    if (typeof selectors === 'string') {
      selectors = [selectors]
    }
    const timer = setInterval(() => {
      const doms = selectors.map(s => document.querySelector(s)).filter(Boolean)
      if (doms.length === selectors.length) {
        clearInterval(timer)
        callback(...doms)
      }
    }, 200)
    setTimeout(() => {
      clearInterval(timer)
    }, 10000)
  }
  const xx = 'x'
  waitForDom('.mplayer-display', dom => {
    dom.addEventListener('dblclick', evt => {
      if (evt.target.matches('.mplayer-right *')) {
        return
      }
      const video = document.querySelector('video')
      if (video && !video.paused) {
        video.pause()
      }
    })
  })
  waitForDom('video', video => {
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
  })
  waitForDom(['video', '.mplayer-right'], (video, right) => {
    if (!document.getElementById('download-button')) {
      const downloadBtn = document.createElement('div')
      downloadBtn.id = 'download-button'
      downloadBtn.innerHTML = '&#8659;'
      downloadBtn.style.cssText = `
        width: 24px;
        height: 24px;
        color: white;
        font-size: 28px;
        line-height: 24px;
        text-align: center;
        background: rgba(0,0,0,.2);
        border-radius: 50%;
      `
      downloadBtn.addEventListener('click', () => {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            action: 'downloadVideo',
            payload: video.src,
          }),
        )
      })
      right.appendChild(downloadBtn)
    }
    if (!document.getElementById('play-rate-button')) {
      const rateBtn = document.createElement('div')
      rateBtn.id = 'play-rate-button'
      rateBtn.innerHTML = '1' + xx
      rateBtn.dataset.rate = '1'
      rateBtn.style.cssText = `
        width: 24px;
        height: 24px;
        color: white;
        font-size: 14px;
        line-height: 28px;
        text-align: center;
        background: rgba(0,0,0,.2);
        border-radius: 50%;
        margin-top: 12px;
      `
      rateBtn.addEventListener('click', () => {
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
        video.dataset.longPress = 'true'
      }
    }, 1200)
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
    if (video && video.dataset.longPress === 'true') {
      video.playbackRate = 1
      video.dataset.longPress = 'false'
      const rateBtn = document.getElementById('play-rate-button')
      if (rateBtn) {
        rateBtn.dataset.rate = '1'
        rateBtn.textContent = '1' + xx
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
