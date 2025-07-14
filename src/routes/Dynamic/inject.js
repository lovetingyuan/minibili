function __$inject() {
  const waitFor = (value, callback) => {
    if (value()) {
      callback()
    } else {
      const timer = setInterval(() => {
        if (value()) {
          callback()
          clearInterval(timer)
        }
      }, 50)
    }
  }

  // 添加样式
  waitFor(
    () => document.head,
    () => {
      const style = document.createElement('style')
      style.textContent = `
    m-open-app:has(.m-fixed-openapp, .bm-link-card-goods, .easy-follow-btn),
      .m-navbar, .m-space-info .banner, .archive-list, .tabs, .info-main,
      .reply-input, .bili-dyn-item-header__following, .dyn-orig-author__right,
      .openapp-dialog, .dyn-header__right, .m-footer, .dyn-goods, .opus-read-more,
      .reply:has(.iconfont) {
      display: none!important;
    }
    .dyn-draw__picture {
      max-height: 200px!important;
      border-radius: 10px;
    }

    .dynamic-list {
      display: block!important;
    }
    .opus-modules {
      padding-top: 0px!important;
    }
    .opus-module-title {
      margin-top: 18px!important;
    }

    .m-space-info {
      margin-top: 0!important;
      padding-top: 12px!important;
      border-bottom: 1px solid #e5e5e5;
    }
    .bili-dyn-item {
      border-bottom: 1px solid #e5e5e5;
    }
    .bili-dyn-item-archive__card {
      display: flex;
      gap: 15px;
    }
    .bili-dyn-item-archive__main {
      width: 50vw!important;
      flex-shrink: 0;
      border-radius: 10px;
      overflow: hidden;
    }
    .bili-dyn-item-archive__cover {
      height: 120px!important;
    }
    .bili-dyn-item-archive__cushion {
      flex-wrap: wrap;
    }
    .bili-dyn-item-archive__title {
      line-height: 1.6!important;
      white-space: normal!important;
      padding-top: 0!important;
      font-size: 16px!important;
    }
    .bili-dyn-item-archive__meta {
      font-size: 13px;
      font-weight: bold;
      background: rgba(0, 0, 0, .5);
      min-height: max-content;
    }
    .m-opus {
      padding-top: 0!important;
    }

    `
      document.head.appendChild(style)
    },
  )

  // 分享、打开视频、打开动态
  waitFor(
    () => document.body,
    () => {
      document.body.addEventListener(
        'click',
        (e) => {
          if (e.target.matches('.bili-dyn-item-footer__button.forward')) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            const item = e.target.closest('m-open-app')
            const link = item.getAttribute('universallink')
            const texts = item.innerText
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                action: 'share-content',
                payload: { link, texts },
              }),
            )
            return
          }
          const item = e.target.closest('m-open-app')
          if (item) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            const schema = item.getAttribute('schema')
            const state = window.__INITIAL_STATE__
            if (schema.startsWith('bilibili://video/')) {
              const av = item.getAttribute('schema').split('/').pop()
              const payload = {
                av,
                title:
                  item.querySelector('.bili-dyn-item-archive__title')
                    ?.textContent ||
                  item.querySelector('.up-archive__item__title')?.textContent,
              }
              if (state) {
                payload.mid = state.space.mid
                payload.face = state.space.info.face
                payload.name = state.space.info.name
              }
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  action: 'open-video',
                  payload,
                }),
              )
            } else if (schema.startsWith('bilibili://opus/detail/')) {
              const link = item.getAttribute('universallink')
              // window.localStorage.setItem('__scroll__', window.scrollY)
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  action: 'open-dynamic-detail',
                  payload: {
                    url: link,
                    title: `${state?.space?.info?.name}的动态`,
                  },
                }),
              )
            }
          }
        },
        true,
      )
    },
  )
  // 添加粉丝数
  window.addEventListener('load', () => {
    setTimeout(() => {
      const fans = document.querySelector('.relation .count .fans')
      const base = document.querySelector('.info-detail .base')
      if (fans && base) {
        const fansCount = fans.textContent.replace(/\s/g, '')
        const span = document.createElement('span')
        span.style.fontSize = '14px'
        span.style.marginLeft = '10px'
        span.style.opacity = '0.8'
        span.textContent = fansCount
        base.appendChild(span)
      }
    }, 100)
  })
}

export default `(${__$inject})();`
