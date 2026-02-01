function __$inject() {
  const waitFor = (value, callback) => {
    if (value()) {
      callback();
    } else {
      const timer = setInterval(() => {
        if (value()) {
          callback();
          clearInterval(timer);
        }
      }, 50);
    }
  };

  // 添加样式
  waitFor(
    () => document.head,
    () => {
      const style = document.createElement("style");

      style.textContent = `
      .m-space .list {
            width: 100%;
            min-height: 80vh;
           background:
                /* 第一张卡片 */
                linear-gradient(#e2e2e2, #e2e2e2),           /* 图片 */
                linear-gradient(#e2e2e2 14px, transparent 14px), /* 标题 */
                linear-gradient(#e2e2e2 10px, transparent 10px),   /* 描述1 */
                linear-gradient(#e2e2e2 10px, transparent 10px),   /* 描述2 */
                linear-gradient(#e2e2e2 8px, transparent 8px),   /* 标签/价格 */

                /* 第二张卡片 */
                linear-gradient(#e2e2e2, #e2e2e2),           /* 图片 */
                linear-gradient(#e2e2e2 14px, transparent 14px), /* 标题 */
                linear-gradient(#e2e2e2 10px, transparent 10px),   /* 描述1 */
                linear-gradient(#e2e2e2 10px, transparent 10px),   /* 描述2 */
                linear-gradient(#e2e2e2 8px, transparent 8px),   /* 标签/价格 */

                /* 第三张卡片 */
                linear-gradient(#e2e2e2, #e2e2e2),           /* 图片 */
                linear-gradient(#e2e2e2 14px, transparent 14px), /* 标题 */
                linear-gradient(#e2e2e2 10px, transparent 10px),   /* 描述1 */
                linear-gradient(#e2e2e2 10px, transparent 10px),   /* 描述2 */
                linear-gradient(#e2e2e2 8px, transparent 8px),   /* 标签/价格 */

                /* 第四张卡片 */
                linear-gradient(#e2e2e2, #e2e2e2),           /* 图片 */
                linear-gradient(#e2e2e2 14px, transparent 14px), /* 标题 */
                linear-gradient(#e2e2e2 10px, transparent 10px),   /* 描述1 */
                linear-gradient(#e2e2e2 10px, transparent 10px),   /* 描述2 */
                linear-gradient(#e2e2e2 8px, transparent 8px),   /* 标签/价格 */

                /* 整体背景 */
                linear-gradient(#ffffff, #ffffff);

            background-position:
                /* 第一张卡片 - 左右各留40px空白 */
                20px 20px,        /* 图片 */
                20px 140px,       /* 标题 */
                20px 160px,       /* 描述1 */
                20px 175px,       /* 描述2 */
                20px 195px,       /* 标签/价格 */

                /* 第二张卡片 */
                20px 220px,       /* 图片 */
                20px 340px,       /* 标题 */
                20px 360px,       /* 描述1 */
                20px 375px,       /* 描述2 */
                20px 395px,       /* 标签/价格 */

                /* 第三张卡片 */
                20px 420px,       /* 图片 */
                20px 540px,       /* 标题 */
                20px 560px,       /* 描述1 */
                20px 575px,       /* 描述2 */
                20px 595px,       /* 标签/价格 */

                /* 第四张卡片 */
                20px 620px,       /* 图片 */
                20px 740px,       /* 标题 */
                20px 760px,       /* 描述1 */
                20px 775px,       /* 描述2 */
                20px 795px,       /* 标签/价格 */

                0 0;              /* 整体背景 */

            background-size:
                /* 第一张卡片尺寸 - 左右各留40px，总宽度80% */
                80% 110px,      /* 图片 */
                200px 14px,       /* 标题 */
                350px 10px,       /* 描述1 */
                300px 10px,       /* 描述2 */
                80px 8px,         /* 标签/价格 */

                /* 第二张卡片尺寸 (变化长度) */
                80% 110px,
                180px 14px,
                320px 10px,
                280px 10px,
                90px 8px,

                /* 第三张卡片尺寸 */
                80% 110px,
                220px 14px,
                380px 10px,
                330px 10px,
                70px 8px,

                /* 第四张卡片尺寸 */
                80% 110px,
                160px 14px,
                290px 10px,
                250px 10px,
                100px 8px,

                100% 100%;        /* 整体背景 */

            background-repeat: no-repeat;
            position: relative;
            overflow: hidden;
      }
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

    `;
      if (location.pathname === "/topic-detail") {
        style.textContent = `
        .m-navbar,  .fixed-openapp, .m-topic-float-openapp  {
         display: none!important;
        }
         .topic-detail-container {
         top: 0!important;
         }
        `;
      }
      document.head.appendChild(style);
    },
  );

  waitFor(
    () => {
      const noMore = document.querySelector(".no-more");
      if (noMore) {
        return true;
      }
      const list = document.querySelector(".m-space .list");
      const list2 = document.querySelector(".list-scroll-content-wrap");
      return list && list2?.childElementCount > 0;
    },
    () => {
      const list = document.querySelector(".m-space .list");
      list.style.background = "none";
    },
  );

  // 分享、打开视频、打开动态
  waitFor(
    () => document.body,
    () => {
      document.body.addEventListener(
        "click",
        (e) => {
          if (e.target.closest(".bili-dyn-topic[data-url]")) {
            const target = e.target.closest(".bili-dyn-topic[data-url]");
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                action: "open-topic",
                payload: {
                  url: target.dataset.url,
                  title: target.textContent,
                },
              }),
            );
            return;
          }
          if (e.target.matches(".bili-dyn-item-footer__button.forward")) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const item = e.target.closest("m-open-app");
            const link = item.getAttribute("universallink");
            const texts = item.innerText;
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                action: "share-content",
                payload: { link, texts },
              }),
            );
            return;
          }
          const item = e.target.closest("m-open-app");
          if (item) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const schema = item.getAttribute("schema");
            const state = window.__INITIAL_STATE__;
            if (schema.startsWith("bilibili://video/")) {
              const { pathname } = new URL(schema);
              const av = pathname.split("/").pop();
              const payload = {
                av,
                title:
                  item.querySelector(".bili-dyn-item-archive__title")?.textContent ||
                  item.querySelector(".up-archive__item__title")?.textContent,
              };
              if (state) {
                payload.mid = state.space.mid;
                payload.face = state.space.info.face;
                payload.name = state.space.info.name;
              }
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  action: "open-video",
                  payload,
                }),
              );
            } else if (schema.startsWith("bilibili://opus/detail/")) {
              const link = item.getAttribute("universallink");
              // window.localStorage.setItem('__scroll__', window.scrollY)
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  action: "open-dynamic-detail",
                  payload: {
                    url: link,
                    title: `${state?.space?.info?.name}的动态`,
                  },
                }),
              );
            }
          }
        },
        true,
      );
    },
  );
  // 添加粉丝数
  window.addEventListener("load", () => {
    setTimeout(() => {
      const fans = document.querySelector(".relation .count .fans");
      const base = document.querySelector(".info-detail .base");
      if (fans && base) {
        const fansCount = fans.textContent.replace(/\s/g, "");
        const span = document.createElement("span");
        span.style.fontSize = "14px";
        span.style.marginLeft = "10px";
        span.style.opacity = "0.8";
        span.textContent = fansCount;
        base.appendChild(span);
      }
    }, 100);
  });
}

export default `(${__$inject})();`;
