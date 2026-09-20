function __$hack() {
  const style = document.createElement("style");
  document.head.appendChild(style);

  const waitDom = (selector, callback) => {
    const timer = setInterval(() => {
      const dom = document.querySelector(selector);
      if (dom) {
        clearInterval(timer);
        callback(dom);
      }
    }, 100);
  };

  const roomId = window.location.pathname.split("/").pop();

  // 发送直播间弹幕：输入条、发送请求与结果提示全部在网页里实现。
  // 网页自带的 .control-panel 只是个唤起 App 的假输入框，这里自己渲染一个真的，
  // 请求参数与官方播放器的 /msg/send 调用一致（实测不需要 WBI 签名），
  // 直接用网页自己的登录 cookie（bili_jct）。
  const DANMAKU_API_URL = "https://api.live.bilibili.com/msg/send";
  const DANMAKU_MAX_LENGTH = 40;
  const DANMAKU_TOAST_MS = 2000;
  const DANMAKU_INPUT_ID = "minibili-danmaku-input";
  let danmakuSending = false;
  let danmakuToastTimer = null;

  const readDanmakuCsrf = () =>
    (document.cookie.match(/(?:^|;\s*)bili_jct=([^;]+)/) || [])[1] || "";

  const showDanmakuToast = (text) => {
    let toast = document.getElementById("minibili-danmaku-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "minibili-danmaku-toast";
      toast.className = "minibili-danmaku-toast";
      (document.body || document.documentElement)?.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.display = "block";
    clearTimeout(danmakuToastTimer);
    danmakuToastTimer = setTimeout(() => {
      toast.style.display = "none";
    }, DANMAKU_TOAST_MS);
  };

  const resolveDanmakuErrorText = (code, message) => {
    // -101 网页里没有登录态；-111 CSRF 校验失败，通常是登录态已经变化
    if (code === -101) {
      return "请先登录 B 站后再发送弹幕";
    }
    if (code === -111) {
      return "登录状态已失效，请重新登录 B 站";
    }
    // -1 是网络异常或响应不可解析，无法判断弹幕是否已经发出
    if (code === -1) {
      return "无法确认弹幕是否发送成功，请稍后到直播间确认";
    }
    return message || "弹幕发送失败，请稍后重试";
  };

  const requestSendDanmaku = (text) => {
    const csrf = readDanmakuCsrf();
    if (!csrf) {
      return Promise.resolve({ code: -101, message: "" });
    }

    const form = new FormData();
    form.append("roomid", String(roomId));
    form.append("msg", text);
    form.append("color", "16777215");
    form.append("fontsize", "25");
    form.append("mode", "1");
    form.append("rnd", String(Math.floor(Date.now() / 1000)));
    form.append("data_extend", "{}");
    form.append("csrf", csrf);
    form.append("csrf_token", csrf);

    return fetch(DANMAKU_API_URL, {
      method: "POST",
      credentials: "include",
      body: form,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(String(res.status));
        }
        return res.json();
      })
      .then((res) => ({
        code: typeof res?.code === "number" ? res.code : -1,
        message: typeof res?.message === "string" ? res.message : "",
      }))
      .catch(() => ({ code: -1, message: "" }));
  };

  const mountDanmakuComposer = () => {
    if (document.getElementById(DANMAKU_INPUT_ID) || danmakuSending) {
      return true;
    }
    const host = document.body || document.documentElement;
    if (!host) {
      return false;
    }

    const bar = document.createElement("div");
    bar.className = "minibili-danmaku-bar";

    const input = document.createElement("input");
    input.id = DANMAKU_INPUT_ID;
    input.className = "minibili-danmaku-input";
    input.type = "text";
    input.maxLength = DANMAKU_MAX_LENGTH;
    input.placeholder = "发个弹幕呗~";
    input.setAttribute("enterkeyhint", "send");

    const sendButton = document.createElement("button");
    sendButton.type = "button";
    sendButton.className = "minibili-danmaku-send";
    sendButton.textContent = "发送";

    const submit = () => {
      if (danmakuSending) {
        return;
      }
      const text = input.value.trim();
      if (!text) {
        showDanmakuToast("请输入弹幕内容");
        return;
      }
      danmakuSending = true;
      sendButton.disabled = true;
      requestSendDanmaku(text).then((result) => {
        danmakuSending = false;
        sendButton.disabled = false;
        if (result.code === 0) {
          input.value = "";
          input.blur();
          showDanmakuToast("弹幕已发送");
          return;
        }
        showDanmakuToast(resolveDanmakuErrorText(result.code, result.message));
      });
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault();
        submit();
      }
    });
    sendButton.addEventListener("click", submit);
    // 输入条由自己渲染，别让页面上的"唤起 App"逻辑抢走点击
    bar.addEventListener("click", (event) => event.stopPropagation());

    bar.appendChild(input);
    bar.appendChild(sendButton);
    host.appendChild(bar);
    return true;
  };

  mountDanmakuComposer();
  if (typeof window.MutationObserver === "function") {
    // 页面重新渲染后输入条可能被移除，这里补回来
    const danmakuObserver = new window.MutationObserver(() => {
      if (!document.getElementById(DANMAKU_INPUT_ID)) {
        mountDanmakuComposer();
      }
    });
    const observerRoot = document.body || document.documentElement;
    if (observerRoot) {
      danmakuObserver.observe(observerRoot, { childList: true, subtree: true });
    }
  } else {
    setInterval(mountDanmakuComposer, 1000);
  }

  // 「房间观众(N)」是直播间在线榜（房间观众榜）的人数，与 getInfoByRoom 数据里的
  // room_rank_info.user_rank_entry.user_contribution_rank_entry.count_text 是同一个数
  const AUDIENCE_COUNT_INTERVAL = 60 * 1000;
  const RANK_LIST_ID = "minibili-live-rank-list";
  let audienceCountText = "";
  let audienceRanks = [];
  const renderAudienceCount = () => {
    const dom = document.getElementById("live-audience-count");
    if (dom && audienceCountText) {
      dom.textContent = `房间观众(${audienceCountText})`;
    }
  };
  // 头像面板（.anchor_popUp）里的房间观众榜前三
  const renderAudienceRanks = () => {
    const container = document.querySelector(".anchor_popUp");
    if (!container || !audienceRanks.length) {
      return false;
    }
    let list = document.getElementById(RANK_LIST_ID);
    if (!list) {
      list = document.createElement("ol");
      list.id = RANK_LIST_ID;
      list.style.cssText =
        "list-style: none; font-size: 14px; text-align: left; padding-left: 24px; margin-top: 20px;";
      container.appendChild(list);
    }
    list.innerHTML = audienceRanks
      .map(
        (rank, index) => `<li style="margin: 10px 0;">
                    <span style="color: #F85A54; font-weight: bold">榜${index + 1}</span>
                  <img src="${rank.face}" style="vertical-align: middle;margin: 0 8px;border-radius: 100px;" width="24" height="24">
                  <span style="vertical-align: middle;">${rank.name}: ${rank.score}</span>
                  </li>`,
      )
      .join("");
    return true;
  };
  const startAudienceCountPolling = (anchorUid) => {
    if (!anchorUid) {
      return;
    }
    const updateAudienceCount = () => {
      fetch(
        `https://api.live.bilibili.com/xlive/general-interface/v1/rank/queryContributionRank?room_id=${roomId}&ruid=${anchorUid}&page=1&page_size=3&type=online_rank`,
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((res) => {
          if (res?.code !== 0) {
            return;
          }
          const countText = res.data?.count_text || String(res.data?.count ?? "");
          if (countText && countText !== audienceCountText) {
            audienceCountText = countText;
            renderAudienceCount();
          }
          const item = Array.isArray(res.data?.item) ? res.data.item.slice(0, 3) : [];
          if (item.length) {
            audienceRanks = item.map((rank) => ({
              face: rank.face,
              name: rank.name,
              score: rank.score,
            }));
            renderAudienceRanks();
          }
        })
        .catch(() => {});
    };
    updateAudienceCount();
    setInterval(updateAudienceCount, AUDIENCE_COUNT_INTERVAL);
  };
  fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getH5InfoByRoom?room_id=${roomId}`)
    .then((res) => {
      if (!res.ok) {
        return null;
      }
      return res.json();
    })
    .then((res) => {
      if (res?.code === 0) {
        waitDom(".web-player-danmaku", (dom) => {
          dom.nextElementSibling?.click();
          setTimeout(() => {
            document.querySelector("video")?.removeAttribute("autoplay");
          }, 1000);
        });
        startAudienceCountPolling(res.data.room_info.uid);
        const liveTime = new Date(res.data.room_info.live_start_time * 1000);
        const minute = liveTime.getMinutes();
        waitDom(".room-info", (liveInfo) => {
          // 开播时间与房间观众数上下堆叠，保证房间观众数落在开播时间正下方
          const liveMeta = document.createElement("span");
          liveMeta.id = "live-meta";
          liveMeta.style.cssText = `
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          justify-content: center;
          margin-left: 8px;
          margin-right: 8px;
          `;

          const liveTimeSpan = document.createElement("span");
          liveTimeSpan.textContent = `${liveTime.getHours()}:${
            minute < 10 ? `0${minute}` : minute
          }开始`;
          liveTimeSpan.style.cssText = `
          font-size: 10px;
          color: white;
          `;
          liveMeta.appendChild(liveTimeSpan);

          const audienceCountSpan = document.createElement("span");
          audienceCountSpan.id = "live-audience-count";
          audienceCountSpan.style.cssText = `
          font-size: 10px;
          color: white;
          `;
          liveMeta.appendChild(audienceCountSpan);

          liveInfo.appendChild(liveMeta);
          renderAudienceCount();

          // 点头像会弹出主播信息面板，面板里的榜单由注入脚本自己插进去
          liveInfo.addEventListener("click", () => {
            let remainingAttempts = 15;
            const timer = setInterval(() => {
              remainingAttempts -= 1;
              if (renderAudienceRanks() || remainingAttempts <= 0) {
                clearInterval(timer);
              }
            }, 200);
          });

          const backplay = document.createElement("span");
          backplay.textContent = "后台播放";
          backplay.style.cssText = `
          font-size: 12px;
          color: white;
          margin-left: 8px;
          margin-right: 8px;
        `;
          backplay.id = "live-background-button";
          backplay.addEventListener("click", (evt) => {
            evt.stopPropagation();
            const controller = window.__minibiliLiveBackgroundPlayback;
            if (!controller) {
              return;
            }
            backplay.dataset.backgroundPlay = controller.toggle() ? "true" : "false";
          });
          liveInfo.appendChild(backplay);
        });
      }
    });
  window.__update_live_info = (obj) => {
    const rankEntry =
      obj?.roomInfoRes?.data?.room_rank_info?.user_rank_entry?.user_contribution_rank_entry;
    const countText = rankEntry?.count_text || String(rankEntry?.count ?? "");
    if (!countText) {
      return;
    }
    const liveCountSpan = document.getElementById("live-count-text");
    if (liveCountSpan) {
      liveCountSpan.textContent = `${countText}在线`;
    } else {
      waitDom(".room-info", (liveInfo) => {
        if (document.getElementById("live-count-text")) {
          return;
        }
        const onlineTextSpan = document.createElement("span");
        onlineTextSpan.textContent = `${countText}在线`;
        onlineTextSpan.style.cssText = `
        font-size: 12px;
        color: white;
        margin: 0 8px;
        `;
        onlineTextSpan.id = "live-count-text";
        liveInfo.appendChild(onlineTextSpan);
      });
    }
  };
  const updateLiveInfo = () => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        action: "update-live-info",
        payload: JSON.stringify({
          url: "https://live.bilibili.com/" + roomId,
          callback: "__update_live_info",
        }),
      }),
    );
  };
  updateLiveInfo();
  setInterval(updateLiveInfo, 5 * 60 * 1000);
}

function __$injectBefore() {
  const createBackgroundPlaybackController = () => {
    let enabled = false;
    let worker = null;
    let watchdogTimer = null;
    let videoObserver = null;
    let observedVideo = null;
    let audioContext = null;
    let audioOscillator = null;
    let audioGain = null;
    let restoreMuteTimer = null;
    const playbackInterruptionEvents = ["pause", "stalled", "suspend", "waiting", "emptied"];

    const scheduleMuteRestore = (video, muted) => {
      if (restoreMuteTimer !== null) {
        window.clearTimeout(restoreMuteTimer);
      }
      restoreMuteTimer = window.setTimeout(() => {
        video.muted = muted;
        restoreMuteTimer = null;
      }, 100);
    };

    const retryMuted = (video, muted) => {
      video.muted = true;
      try {
        const retry = video.play();
        if (retry && typeof retry.then === "function") {
          retry.then(
            () => scheduleMuteRestore(video, muted),
            () => scheduleMuteRestore(video, muted),
          );
          return;
        }
      } catch {}
      scheduleMuteRestore(video, muted);
    };

    const handlePlaybackInterruption = () => {
      if (enabled) {
        resumeVideo();
      }
    };

    const getVideo = () => {
      const video = document.querySelector("video");
      if (video === observedVideo) {
        return video;
      }
      if (observedVideo) {
        playbackInterruptionEvents.forEach((event) => {
          observedVideo.removeEventListener(event, handlePlaybackInterruption);
        });
      }
      observedVideo = video;
      if (observedVideo) {
        playbackInterruptionEvents.forEach((event) => {
          observedVideo.addEventListener(event, handlePlaybackInterruption);
        });
      }
      return observedVideo;
    };

    function resumeVideo() {
      if (!enabled) {
        return;
      }
      const video = getVideo();
      if (!video || !video.paused || video.ended) {
        return;
      }

      const muted = video.muted;
      try {
        const play = video.play();
        if (play && typeof play.catch === "function") {
          play.catch(() => retryMuted(video, muted));
        }
      } catch {
        retryMuted(video, muted);
      }
    }

    const startVideoObserver = () => {
      getVideo();
      if (videoObserver || typeof window.MutationObserver !== "function") {
        return;
      }
      const root = document.documentElement || document.body;
      if (!root) {
        return;
      }
      videoObserver = new window.MutationObserver(() => {
        getVideo();
        if (enabled && document.hidden) {
          resumeVideo();
        }
      });
      videoObserver.observe(root, { childList: true, subtree: true });
    };

    const stopVideoObserver = () => {
      videoObserver?.disconnect();
      videoObserver = null;
      if (observedVideo) {
        playbackInterruptionEvents.forEach((event) => {
          observedVideo.removeEventListener(event, handlePlaybackInterruption);
        });
      }
      observedVideo = null;
    };

    const startAudioKeepAlive = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (typeof AudioContext !== "function") {
        return;
      }
      try {
        if (!audioContext) {
          audioContext = new AudioContext();
          audioOscillator = audioContext.createOscillator();
          audioGain = audioContext.createGain();
          audioOscillator.frequency.value = 20;
          audioGain.gain.value = 0.0001;
          audioOscillator.connect(audioGain);
          audioGain.connect(audioContext.destination);
          audioOscillator.start();
        }
        if (audioContext.state === "suspended") {
          audioContext.resume().catch(() => {});
        }
      } catch {}
    };

    const stopAudioKeepAlive = () => {
      try {
        audioOscillator?.stop();
      } catch {}
      try {
        audioContext?.close().catch(() => {});
      } catch {}
      audioOscillator = null;
      audioGain = null;
      audioContext = null;
    };

    const updateMediaSession = () => {
      try {
        if (window.navigator?.mediaSession) {
          window.navigator.mediaSession.playbackState = enabled ? "playing" : "none";
        }
      } catch {}
    };

    const getWorker = () => {
      if (worker) {
        return worker;
      }
      if (
        typeof window.Worker !== "function" ||
        typeof window.Blob !== "function" ||
        typeof window.URL?.createObjectURL !== "function"
      ) {
        return null;
      }

      let workerUrl = "";
      try {
        const source = `
          let timer = null;
          self.onmessage = (event) => {
            if (event.data === "start") {
              self.clearInterval(timer);
              timer = self.setInterval(() => self.postMessage("tick"), 1000);
            }
            if (event.data === "stop") {
              self.clearInterval(timer);
              timer = null;
            }
          };
        `;
        workerUrl = window.URL.createObjectURL(
          new window.Blob([source], { type: "text/javascript" }),
        );
        worker = new window.Worker(workerUrl);
        worker.onmessage = resumeVideo;
      } catch {
        worker = null;
      } finally {
        if (workerUrl && typeof window.URL.revokeObjectURL === "function") {
          window.URL.revokeObjectURL(workerUrl);
        }
      }
      return worker;
    };

    const startWorker = () => {
      resumeVideo();
      getWorker()?.postMessage("start");
    };

    const stopWorker = () => {
      worker?.postMessage("stop");
    };

    const startWatchdog = () => {
      if (watchdogTimer === null) {
        watchdogTimer = window.setInterval(resumeVideo, 1000);
      }
    };

    const stopWatchdog = () => {
      if (watchdogTimer !== null) {
        window.clearInterval(watchdogTimer);
        watchdogTimer = null;
      }
    };

    const startKeepAlive = () => {
      startWorker();
      startWatchdog();
      startAudioKeepAlive();
    };

    const stopKeepAlive = () => {
      stopWorker();
      stopWatchdog();
    };

    const setEnabled = (nextEnabled) => {
      enabled = Boolean(nextEnabled);
      updateMediaSession();
      if (enabled) {
        startVideoObserver();
        startAudioKeepAlive();
      }
      if (enabled && document.hidden) {
        startKeepAlive();
      } else {
        stopKeepAlive();
        if (enabled) {
          resumeVideo();
        } else {
          stopVideoObserver();
          stopAudioKeepAlive();
        }
      }
      return enabled;
    };

    window.addEventListener(
      "visibilitychange",
      (event) => {
        if (!enabled) {
          return;
        }
        event.stopImmediatePropagation();
        if (document.hidden) {
          startKeepAlive();
        } else {
          stopKeepAlive();
          startAudioKeepAlive();
          resumeVideo();
        }
      },
      true,
    );

    return {
      isEnabled: () => enabled,
      setEnabled,
      toggle: () => setEnabled(!enabled),
    };
  };

  window.__minibiliLiveBackgroundPlayback ??= createBackgroundPlaybackController();

  // 直播间网页里部分图片（大表情、点赞图标等）的地址是 http://，
  // 而 WebView 会拦截 https 页面里的 http 子资源（混合内容），这些图片就一直加载失败。
  // 这里在图片发起请求前把地址换成 https，已经失败的再用 https 兜底重试一次。
  const ensureHttpsImages = () => {
    const HTTP_URL = /^http:\/\//i;
    const toHttps = (url) => url.replace(HTTP_URL, "https://");
    const upgradeImage = (element) => {
      if (element.tagName !== "IMG" && element.tagName !== "SOURCE") {
        return;
      }
      ["src", "data-src"].forEach((attribute) => {
        const url = element.getAttribute(attribute);
        if (url && HTTP_URL.test(url)) {
          element.setAttribute(attribute, toHttps(url));
        }
      });
      const srcset = element.getAttribute("srcset");
      if (srcset && /http:\/\//i.test(srcset)) {
        element.setAttribute("srcset", srcset.replace(/(^|,)(\s*)http:\/\//gi, "$1$2https://"));
      }
    };
    const upgradeNode = (node) => {
      if (!node || node.nodeType !== 1) {
        return;
      }
      upgradeImage(node);
      // 装扮弹幕的背景图写在行内样式的 url() 里，同样会被混合内容拦截
      const style = node.getAttribute("style");
      if (style && /url\((['"]?)http:\/\//i.test(style)) {
        node.setAttribute("style", style.replace(/url\((['"]?)http:\/\//gi, "url($1https://"));
      }
      Array.from(node.querySelectorAll("img, source")).forEach(upgradeImage);
    };

    if (typeof window.MutationObserver === "function") {
      // 弹幕是不断插入 DOM 的，解析出的 http 图片要在请求发出前改掉
      const observer = new window.MutationObserver((records) => {
        records.forEach((record) => {
          if (record.type === "attributes") {
            upgradeImage(record.target);
            return;
          }
          Array.from(record.addedNodes).forEach(upgradeNode);
        });
      });
      observer.observe(document.documentElement || document, {
        attributeFilter: ["data-src", "src", "srcset"],
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    // 兜底：图片已经被拦下来（error）时，用 https 再试一次
    document.addEventListener(
      "error",
      (event) => {
        const target = event.target;
        if (!target || target.tagName !== "IMG") {
          return;
        }
        const url = target.getAttribute("src");
        if (!url || !HTTP_URL.test(url) || target.dataset.minibiliHttpsRetry === "true") {
          return;
        }
        target.dataset.minibiliHttpsRetry = "true";
        target.setAttribute("src", toHttps(url));
      },
      true,
    );

    Array.from(document.querySelectorAll("img, source")).forEach(upgradeImage);
  };
  ensureHttpsImages();

  const style = document.createElement("style");
  style.textContent = `
  /* 网页自带的输入框只是唤起 App 的入口，弹幕输入条由注入脚本自己渲染 */
  #app .control-panel {
    display: none!important;
  }
  #app .open-app-btn.follow-btn, .room-info .open-app-btn, .open-app-btn.bili-btn-warp {
    display: none!important;
  }
  /* 让 .room-info 胶囊自适应高度，容纳「开播时间 / 房间观众」两行文字；
     空间不够时整块换行，避免挤占主播信息（点赞/粉丝文案）的宽度 */
  #app .room-info {
    height: auto;
    min-height: .96rem;
    flex-wrap: wrap;
  }
  #app .room-info .info-cntr {
    flex: 0 0 auto;
  }
  /* 点赞/粉丝轮播的文案框给足宽度，避免文案被裁切或遮盖 */
  #app .room-info .swiper,
  #app .room-info .like-con,
  #app .room-info .like,
  #app .room-info .popularity {
    max-width: 4.2rem;
  }
  /* 轮播项同时只存在一个，让它参与宽度计算：容器按文案自然撑开，不再被裁切，也不留空白 */
  #app .room-info .swiper {
    overflow: visible;
  }
  #app .room-info .like-con {
    height: auto;
    position: static;
  }
  /* 自绘的弹幕输入条：占住页面原本留给 .control-panel 的 1.6rem 底部区域。
     WebView 是 edge-to-edge，底边会被系统导航栏盖住，所以整体再抬一个安全区高度：
     --minibili-danmaku-bottom 由 RN 侧写入，env() 作为兜底 */
  .minibili-danmaku-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--minibili-danmaku-bottom, env(safe-area-inset-bottom, 0px));
    height: 1.4rem;
    display: flex;
    align-items: center;
    padding: .16rem .266667rem;
    box-sizing: border-box;
    /* 播放器区域是 z-index:1010 的定位元素，必须盖在它上面 */
    z-index: 3000;
  }
  /* 弹幕列表（.bili-danmaku-brush）跟着输入条一起抬高，避免被盖住 */
  #app #bili-danmaku-wrap {
    bottom: calc(1.4rem + var(--minibili-danmaku-bottom, env(safe-area-inset-bottom, 0px)));
  }
  .minibili-danmaku-input {
    flex: 1;
    height: .746667rem;
    padding: .133333rem .426667rem;
    box-sizing: border-box;
    border: 0;
    border-radius: .426667rem;
    background: rgba(0,0,0,.3);
    color: #FFFFFF;
    font-family: PingFang SC;
    font-size: .32rem;
    line-height: .48rem;
    outline: none;
    -webkit-appearance: none;
  }
  .minibili-danmaku-input::placeholder {
    color: hsla(0,0%,100%,.5);
  }
  .minibili-danmaku-send {
    height: .746667rem;
    margin-left: .266667rem;
    padding: 0 .32rem;
    border: 0;
    border-radius: .426667rem;
    background: #23ADE5;
    color: #FFFFFF;
    font-size: .32rem;
    line-height: .746667rem;
  }
  .minibili-danmaku-send:disabled {
    opacity: .6;
  }
  /* 发送结果提示，浮在输入条上方 */
  .minibili-danmaku-toast {
    display: none;
    position: fixed;
    left: 50%;
    bottom: calc(2rem + var(--minibili-danmaku-bottom, env(safe-area-inset-bottom, 0px)));
    transform: translateX(-50%);
    max-width: 80%;
    padding: .16rem .32rem;
    border-radius: .213333rem;
    background: rgba(0,0,0,.75);
    color: #FFFFFF;
    font-size: .32rem;
    z-index: 3001;
  }
  [data-background-play="true"] {
    color: #FF6699!important;
    font-weight: bold;
  }
  [data-background-play="true"]::after {
    content: "开";
  }
  `;
  if (document.head) {
    document.head.appendChild(style);
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      document.head.appendChild(style);
    });
  }
}

export const INJECTED_JAVASCRIPT = `(${__$hack})(${__DEV__});true;`;
export const INJECTED_JAVASCRIPT_BEFORE = `(${__$injectBefore})(${__DEV__});true;`;
