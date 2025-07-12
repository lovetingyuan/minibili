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

    .dynamic-list {
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
      padding-top: 0!important;
      font-size: 16px!important;
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
      document.head.appendChild(style)
    },
  )

  window.addEventListener('load', () => {
    const commentContainer = window.document.createElement('div')
    commentContainer.innerHTML = `
    <style>
      .comments-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: none;
        z-index: 1000;
      }
      .comments-popup {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 70%;
        background-color: white;
        border-radius: 20px 20px 0 0;
        transform: translateY(100%);
        transition: transform 0.2s ease-out;
        z-index: 1001;
      }
      .comment-popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
        background-color: white;
        position: sticky;
        top: 0;
        padding: 10px 0 10px 0;
      }
      .comments-popup-content {
        font-size: 16px;
        padding: 0 20px 10px 20px;
        overflow-y: auto;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .show-comments-popup {
        display: block;
      }
      .slide-up-comments-popup {
        transform: translateY(0);
      }
      #comment-popup-title {
        font-size: 18px;
      }
      #comment-popup-close {
        padding: 10px;
      }
      #comment-popup-body {
        flex-grow: 1;
      }
    </style>
    <div class="comments-overlay" id="comments-overlay">
      <div class="comments-popup" id="comments-popup">
        <div class="comments-popup-content">
          <div class="comment-popup-header">
            <h2 id="comment-popup-title">更多回复</h2>
            <div id="comment-popup-close">✕</div>
          </div>
          <div id="comment-popup-body">

          </div>
        </div>
      </div>
    </div>
    `
    window.document.body.appendChild(commentContainer)
    const overlay = window.document.getElementById('comments-overlay')
    const popup = window.document.getElementById('comments-popup')
    const close = window.document.getElementById('comment-popup-close')
    window._openPopup = () => {
      window.history.pushState({ popup: 'open' }, 'open popup')
      overlay.classList.add('show-comments-popup')
      window.setTimeout(() => {
        popup.classList.add('slide-up-comments-popup')
      }, 10)
    }

    window.addEventListener('popstate', (evt) => {
      if (evt.state.popup === 'open' || typeof evt.state.idx === 'number') {
        closePopup(true)
      }
    })

    const closePopup = (state) => {
      if (!state) {
        window.history.back()
      }
      popup.classList.remove('slide-up-comments-popup')
      window.setTimeout(() => {
        overlay.classList.remove('show-comments-popup')
      }, 300)
    }

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closePopup()
      }
    })
    close.addEventListener('click', () => {
      closePopup()
    })
  })
  const open = window.open
  window.open = (url, target, features) => {
    if (url.startsWith('https://www.bilibili.com/h5/comment/sub?')) {
      const iframe = window.document.createElement('iframe')
      iframe.src = url
      iframe.id = 'sub-comment-iframe'
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      document.getElementById('comment-popup-body').appendChild(iframe)
      window._openPopup()
      return
    }
    return open(url, target, features)
  }

  if (window.location.pathname.startsWith('/space/')) {
    window.addEventListener('load', () => {
      const scrollY = window.localStorage.getItem('__scroll__')
      if (scrollY) {
        window.scrollTo(0, scrollY)
        window.localStorage.removeItem('__scroll__')
      }
    })
  }
  // 去掉阅读更多按钮
  if (/^\/opus\/\d+$/.test(window.location.pathname)) {
    const timer = setInterval(() => {
      const content = document.querySelector('.opus-module-content')
      if (content && content.classList.contains('limit')) {
        content.classList.remove('limit')
        clearInterval(timer)
      }
    }, 100)
    setTimeout(() => {
      clearInterval(timer)
    }, 5000)
  }

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
              window.localStorage.setItem('__scroll__', window.scrollY)
              window.location.href = link
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
