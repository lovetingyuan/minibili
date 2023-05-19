function __$hack(dev) {
  const style = document.createElement('style')
  document.head.appendChild(style)
  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      action: 'set-title',
      payload: document.title,
    }),
  )
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
  } else if (window.location.pathname.startsWith('/dynamic/')) {
    style.textContent = `
    #app .dyn-header__right {
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
    #app .open-app-btn {
      display: none!important;
    }
    `
    const liveInfo = document.querySelector('.room-info')
    const liveTimeSpan = document.createElement('span')
    try {
      const liveTime = new Date(
        window.__NEPTUNE_IS_MY_WAIFU__.roomInfoRes.data.room_info
          .live_start_time * 1000,
      )
      const minute = liveTime.getMinutes()
      liveTimeSpan.textContent = `${liveTime.getHours()}:${
        minute < 10 ? '0' + minute : minute
      }开始`
      liveTimeSpan.style.cssText = `
      font-size: 12px;
      color: white;
      margin-left: 10px;
      margin-right: 5px;
      `
      liveInfo.appendChild(liveTimeSpan)
    } catch (err) {}
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

  // dev && alert(location.href)
  // dev &&
  //   setTimeout(() => {
  //     alert(location.href)
  //   }, 3000)
}

export const INJECTED_JAVASCRIPT = `(${__$hack})(${__DEV__});true;`
