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
  const style = document.createElement('style')
  style.textContent = `
          m-open-app, .m-navbar, .m-space-info .banner, .archive-list, .tabs, .info-main,
           .reply-input, .bili-dyn-item-header__following, .dyn-orig-author__right,
            .openapp-dialog, .dyn-header__right {
            display: none!important;
          }

          .dynamic-list {
            display: block!important;
          }
          m-open-app:has(.bili-dyn-item, .up-archive__item, .reply-list, .dyn-card) {
            display: block!important;
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
              height: 100px!important;
          }
          .bili-dyn-item-archive__title {
            line-height: 1.6!important;
            white-space: normal!important;
          }
            .bili-dyn-item-archive__meta {
            font-size: 13px;
            font-weight: bold;
                background: rgba(0, 0, 0, .5);
            }
                .m-opus {
                padding-top: 0!important;
                }
  `
  waitFor(
    () => document.head,
    () => {
      document.head.appendChild(style)
    },
  )
  waitFor(
    () => document.body,
    () => {
      document.body.addEventListener(
        'click',
        (e) => {
          if (e.target.matches('.bili-dyn-item-footer__button.forward')) {
            // alert(true)
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
            if (schema.startsWith('bilibili://video/')) {
              const av = item.getAttribute('schema').split('/').pop()
              const state = window.__INITIAL_STATE__
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
              window.location.href = link
            }
          }
        },
        true,
      )
    },
  )
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  window.addEventListener('load', async (e) => {
    await delay(1000)
    const fans = document.querySelector('.relation .count .fans')
    const base = document.querySelector('.info-detail .base')
    // const fansNum = Number(fans?.querySelector('.num')?.textContent)
    if (fans && base) {
      const fansCount = fans.textContent.replace(/\s/g, '')
      const span = document.createElement('span')
      span.style.fontSize = '14px'
      span.style.marginLeft = '10px'
      span.style.opacity = '0.8'
      span.textContent = fansCount
      base.appendChild(span)
    }
  })
}

export default `(${__$inject})();`
