function __$hack() {
  const style = document.createElement('style')
  document.head.appendChild(style)
  // 去掉阅读更多按钮
  // if (/^\/opus\/\d+$/.test(window.location.pathname)) {
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
            <iframe id="sub-comment-iframe" style="width: 100%; height: 100%; border: none;"></iframe>
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
      const iframe = document.querySelector('#sub-comment-iframe')
      iframe.src = url
      window._openPopup()
      return
    }
    return open(url, target, features)
  }

  window.addEventListener('load', (e) => {
    const imgs = document.querySelector('.opus-module-top__album')
    if (imgs) {
      const div = document.createElement('div')
      div.textContent = '下载'
      div.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        color: white;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        padding: 5px 10px;
        border-radius: 5px;
        user-select: none;
      `
      imgs.appendChild(div)
      div.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        const item = [...imgs.querySelectorAll('.v-swipe__item')].find((v) => {
          return v.style.transform.includes('translateX(0px)')
        })
        if (item) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              action: 'open-image',
              payload: {
                url: item.querySelector('img').src.split('@')[0],
              },
            }),
          )
        }
      })
    }
  })
  document.addEventListener(
    'click',
    (e) => {
      const pic = e.target.closest('.bm-pics-block__item')
      if (pic) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        const url = pic.querySelector('img').src.split('@')[0]
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            action: 'open-image',
            payload: { url },
          }),
        )
      }
    },
    true,
  )
}

function __$injectBefore() {
  // alert(document.title)
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
  waitFor(
    () => document.head,
    () => {
      const style = document.createElement('style')
      style.textContent = `
    m-open-app:has(.m-fixed-openapp, .bm-link-card-goods, .easy-follow-btn),
      .m-navbar, .m-space-info .banner, .archive-list, .tabs, .info-main,
      .reply-input, .bili-dyn-item-header__following, .dyn-orig-author__right,
      .openapp-dialog, .dyn-header__right, .m-footer, .dyn-goods, .opus-read-more,
      .reply:has(.iconfont), .reply-item .toolbar .right {
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
}

export const INJECTED_JAVASCRIPT = `(${__$hack})(${__DEV__});true;`
export const INJECTED_JAVASCRIPT_BEFORE = `(${__$injectBefore})(${__DEV__});true;`
