function __$hack() {
  const style = document.createElement('style')
  document.head.appendChild(style)
  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      action: 'set-title',
      payload: document.title,
    }),
  )
  const waitDom = (selector, callback) => {
    const timer = setInterval(() => {
      const dom = document.querySelector(selector)
      if (dom) {
        clearInterval(timer)
        callback(dom)
      }
    }, 200)
  }
  if (window.location.pathname === '/read/mobile') {
    style.textContent = `
    #app bili-open-app {
      display: none!important;
    }
    #app #readRecommendInfo {
      display: none!important;
    }
    #app .reply-input, #app .sub-reply-input {
      display: none!important;
    }
    #app .read-more {
      display: none!important;
    }
    #app .read-article-box.show-later {
      max-height: none!important;
    }
    `
  } else if (
    window.location.pathname.startsWith('/dynamic') ||
    window.location.pathname.startsWith('/opus')
  ) {
    style.textContent = `
    #app .dyn-header__right, .m-open-app.fixed-openapp {
      display: none!important;
    }
    .v-switcher__content__wrap .v-switcher__content__item:first-of-type {
      display: block!important;
    }
    .v-switcher__content__wrap .v-switcher__content__item + .v-switcher__content__item {
      display: none!important;
   }
   #app .reply-input {
    display: none!important;
   }
  #app .v-affix {
    display: none!important;
  }
  #app .dynamic-float-btn.launch-app-btn {
    display: none!important;
  }
  #app .dyn-share {
    display: none!important;
  }
  #app .m-navbar {
    display: none!important;
  }
  #app .dyn-orig-author__right {
    display: none!important;
  }
  #app .m-navbar {
    display: none!important;
  }
  #app .openapp-dialog {
    display: none!important;
  }
  #app .launch-app-btn.float-openapp.opus-float-btn {
    display: none!important;
  }
  #app .m-opus {
    padding-top: 0!important;
  }
  #app .launch-app-btn.opus-module-author__action {
    display: none!important;
  }
  #app .v-affix {
    display: none!important;
  }
  #app .reply-input {
    display: none!important;
   }
   .v-switcher__content__wrap .v-switcher__content__item:first-of-type {
    display: block!important;
  }
  .v-switcher__content__wrap .v-switcher__content__item + .v-switcher__content__item {
    display: none!important;
 }
 #app .opus-read-more {
  display: none!important;
 }
 #app .opus-module-content.limit {
  max-height: none!important;
 }
    `
  } else if (window.location.pathname.startsWith('/space/')) {
    style.textContent = `
    #app .m-navbar {
      display: none!important;
    }
    #app .launch-app-btn.m-space-float-openapp {
      display: none!important;
    }
    #app .follow-btn {
      display: none!important;
    }
    #app .m-space-info .banner {
      height: 40px;
    }
    #app .card-content .top-right {
      display: none!important;
    }
    `
  } else if (window.location.hostname === 'live.bilibili.com') {
    style.textContent = `
    #app .control-panel {
      display: none!important;
    }
    #app .open-app-btn.follow-btn, .room-info .open-app-btn, .open-app-btn.bili-btn-warp {
      display: none!important;
    }
    #app #bili-danmaku-wrap {
      bottom: 12px;
    }
    [data-background-play="true"] {
      color: #FF6699!important;
      font-weight: bold;
    }
    [data-background-play="true"]::after {
      content: "开";
    }
    `
    document.addEventListener('visibilitychange', () => {
      const bgPlayBtn = document.getElementById('live-background-button')
      if (bgPlayBtn.dataset.backgroundPlay !== 'true') {
        return
      }
      if (document.visibilityState === 'hidden') {
        const video = document.querySelector('video')
        setTimeout(() => {
          bgPlayBtn.dataset.backgroundPlay = 'false'
          if (video.paused) {
            video.muted = true
            video.play()
            setTimeout(() => {
              video.muted = false
            })
          }
        }, 1000)
      }
    })
    //https://api.live.bilibili.com/xlive/web-room/v1/index/getH5InfoByRoom?room_id=23716652
    const roomId = window.location.pathname.split('/').pop()
    fetch(
      `https://api.live.bilibili.com/xlive/web-room/v1/index/getH5InfoByRoom?room_id=${roomId}`,
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 0) {
          waitDom('.web-player-danmaku', (dom) => {
            dom.nextElementSibling?.click()
            setTimeout(() => {
              document.querySelector('video')?.removeAttribute('autoplay')
            }, 1000)
          })
          const liveTime = new Date(res.data.room_info.live_start_time * 1000)
          const minute = liveTime.getMinutes()
          waitDom('.room-info', (liveInfo) => {
            const liveTimeSpan = document.createElement('span')
            liveTimeSpan.textContent = `${liveTime.getHours()}:${
              minute < 10 ? `0${minute}` : minute
            }开始`
            liveTimeSpan.style.cssText = `
            font-size: 12px;
            color: white;
            margin-left: 8px;
            margin-right: 8px;
            `
            liveInfo.appendChild(liveTimeSpan)

            const backplay = document.createElement('span')
            backplay.textContent = '后台播放'
            backplay.style.cssText = `
            font-size: 12px;
            color: white;
            margin-left: 8px;
            margin-right: 8px;
          `
            backplay.id = 'live-background-button'
            backplay.addEventListener('click', (evt) => {
              evt.stopPropagation()
              if (backplay.dataset.backgroundPlay === 'true') {
                backplay.dataset.backgroundPlay = 'false'
              } else {
                backplay.dataset.backgroundPlay = 'true'
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({
                    action: 'enable-background-play',
                    payload: null,
                  }),
                )
              }
            })
            liveInfo.appendChild(backplay)
          })
        }
      })
    window.__update_live_info = (obj) => {
      const { count_text, item } =
        obj.roomInfoRes.data.room_rank_info.user_rank_entry
          .user_contribution_rank_entry
      const ranks = item.slice(0, 3).map((v) => {
        return { name: v.name, score: v.score, face: v.face }
      })
      const liveCountSpan = document.getElementById('live-count-text')
      if (liveCountSpan) {
        liveCountSpan.textContent = `${count_text}在线`
        liveCountSpan.dataset.rank = JSON.stringify(ranks)
      } else {
        waitDom('.room-info', (liveInfo) => {
          const onlineTextSpan = document.createElement('span')
          onlineTextSpan.textContent = `${count_text}在线`
          onlineTextSpan.style.fontSize = '12px'
          onlineTextSpan.style.color = 'white'
          onlineTextSpan.style.margin = '0 8px'
          onlineTextSpan.id = 'live-count-text'
          onlineTextSpan.dataset.rank = JSON.stringify(ranks)
          liveInfo.appendChild(onlineTextSpan)
          liveInfo.addEventListener('click', () => {
            setTimeout(() => {
              const container = document.querySelector('.anchor_popUp')
              const ranks = JSON.parse(
                document.getElementById('live-count-text').dataset.rank,
              )
              container.insertAdjacentHTML(
                'beforeend',
                `
                  <ol style="list-style: none;font-size: 14px; text-align: left; padding-left: 24px; margin-top: 20px;">
                  ${ranks
                    .map(
                      (r, i) => `<li style="margin: 10px 0;">
                      <span style="color: #F85A54; font-weight: bold">榜${i + 1}</span>
                    <img src="${r.face}" style="vertical-align: middle;margin: 0 8px;border-radius: 100px;" width="24" height="24">
                    <span style="vertical-align: middle;">${r.name}: ${r.score}</span>
                    </li>`,
                    )
                    .join('')}
                  </ol>
                  `,
              )
            }, 500)
          })
        })
      }
    }
    const updateLiveInfo = () => {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: 'update-live-info',
          payload: JSON.stringify({
            url: 'https://live.bilibili.com/' + roomId,
            callback: '__update_live_info',
          }),
        }),
      )
    }
    updateLiveInfo()
    setInterval(updateLiveInfo, 5 * 60 * 1000)
  } else if (window.location.pathname.startsWith('/topic-detail')) {
    style.textContent = `
    .topic-detail .m-navbar {
      display: none!important;
    }
    .topic-detail .topic-detail-container {
      top: 0;
    }
    .launch-app-btn.m-topic-float-openapp {
      display: none!important;
    }
    .bili-dyn-item-header__following {
      display: none!important;
    }
    `
  } else {
    style.textContent = `
    #app .m-navbar {
      display: none!important;
    }
    #app .m-opus {
      padding-top: 0;
    }
    #app .launch-app-btn.opus-module-author__action {
      display: none!important;
    }
    #app .dyn-card .dyn-header__right {
      display: none!important;
    }

    #app .launch-app-btn.dynamic-float-openapp.dynamic-float-btn {
      display: none!important;
    }
    #app .reply-list .reply-input {
      display: none!important;
    }
    #app .openapp-dialog {
      display: none!important;
    }
    #app .launch-app-btn.float-openapp.opus-float-btn {
      display: none!important;
    }
    .right-entry .v-popover.is-bottom {
      display: none!important;
    }

    `
  }
}

export const INJECTED_JAVASCRIPT = `(${__$hack})(${__DEV__});true;`
