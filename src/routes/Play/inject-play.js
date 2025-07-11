function __$hack() {
  const style = document.createElement('style')
  style.textContent = `
  body[data-replaced] .mplayer-time-total-text {
    font-weight: bold!important;
    font-size: 14px!important;
  }

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
  document.head.appendChild(style)

  document.addEventListener('visibilitychange', (e) => {
    const bgPlayBtn = document.getElementById('play-background-button')
    if (bgPlayBtn.dataset.bgPlay !== 'true') {
      return
    }
    if (document.visibilityState === 'hidden') {
      const video = document.querySelector('video')
      setTimeout(() => {
        if (video.paused) {
          video.muted = true
          video.play()
          setTimeout(() => {
            video.muted = false
          })
        }
      })
      bgPlayBtn.dataset.bgPlay = 'false'
    }
  })

  let originVideoUrl = ''
  const newVideoUrl = decodeURIComponent(window.location.hash.slice(1))
  const reportPlayTime = (lastTime, duration) => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        action: 'reportPlayTime',
        payload: Number.parseFloat(((lastTime * 100) / duration).toFixed(1)),
      }),
    )
  }
  if (window.MutationObserver) {
    const observer = new window.MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        // 遍历 DOM 变更记录
        mutation.addedNodes.forEach(function (node) {
          // 检查是否是 video 元素
          if (node.tagName !== 'VIDEO' || node.dataset.handled) {
            return
          }
          if (node.src && !originVideoUrl) {
            originVideoUrl = node.src
          }
          // node.addEventListener('error', () => {
          //   if (node.src !== originVideoUrl && originVideoUrl) {
          //     node.src = originVideoUrl
          //   }
          //   if (!window.__show_err_alert) {
          //     window.__show_err_alert = true
          //     // eslint-disable-next-line no-alert
          //     alert('视频加载失败')
          //   }
          // })
          node.src = newVideoUrl
          node.dataset.handled = 'true'

          const video = node
          ;['play', 'ended', 'pause'].forEach((evt) => {
            video.addEventListener(evt, () => {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  action: 'playState',
                  payload: evt,
                }),
              )
              if (evt === 'play') {
                setTimeout(() => {
                  reportPlayTime(video.currentTime, video.duration)
                }, 3000)
              } else {
                reportPlayTime(video.currentTime, video.duration)
              }
              if (evt === 'ended') {
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
                }
              }
            })
          })
          ;['timeupdate', 'seeking'].forEach((evt) => {
            video.addEventListener(evt, (e) => {
              if (evt === 'seeking') {
                reportPlayTime(video.currentTime, video.duration)
              }
            })
          })
        })
      })
    })

    // 开始监听 DOM 变更
    observer.observe(document.body, { childList: true, subtree: true })
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
    const timer = setInterval(fn, 100)
    fn()
    setTimeout(() => {
      clearInterval(timer)
    }, 10000)
  }

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
      video.pause()
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
    if (!document.getElementById('play-background-button')) {
      const bgPlayBtn = document.createElement('div')
      bgPlayBtn.id = 'play-background-button'
      bgPlayBtn.innerHTML = `后<style>
        #play-background-button[data-bg-play="true"] {
          color: #FF6699!important;font-weight: bold;
        }
        #play-background-button {
          width: 24px;
          height: 24px;
          color: white;
          font-size: 16px;
          line-height: 28px;
          text-align: center;
          margin-top: 10px;
          background: rgba(0,0,0,.2);
          border-radius: 50%;
        }</style>
      `.trim()
      bgPlayBtn.addEventListener('click', () => {
        if (bgPlayBtn.dataset.bgPlay === 'true') {
          bgPlayBtn.dataset.bgPlay = 'false'
        } else {
          bgPlayBtn.dataset.bgPlay = 'true'
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              action: 'showToast',
              payload: '后台播放已开启',
            }),
          )
        }
      })
      right.appendChild(bgPlayBtn)
    }
  })

  const aa = (element) => {
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
  if (document.body) {
    aa(document.body)
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      aa(document.body)
    })
  }
}

export const INJECTED_JAVASCRIPT = `(${__$hack})();\ntrue;`
