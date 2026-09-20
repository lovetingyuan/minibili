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
