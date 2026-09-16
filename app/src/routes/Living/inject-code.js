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
        const liveTime = new Date(res.data.room_info.live_start_time * 1000);
        const minute = liveTime.getMinutes();
        waitDom(".room-info", (liveInfo) => {
          const liveTimeSpan = document.createElement("span");
          liveTimeSpan.textContent = `${liveTime.getHours()}:${
            minute < 10 ? `0${minute}` : minute
          }开始`;
          liveTimeSpan.style.cssText = `
          font-size: 12px;
          color: white;
          margin-left: 8px;
          margin-right: 8px;
          `;
          liveInfo.appendChild(liveTimeSpan);

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
    const { count_text, item } =
      obj.roomInfoRes.data.room_rank_info.user_rank_entry.user_contribution_rank_entry;
    const ranks = item.slice(0, 3).map((v) => {
      return { name: v.name, score: v.score, face: v.face };
    });
    const liveCountSpan = document.getElementById("live-count-text");
    if (liveCountSpan) {
      liveCountSpan.textContent = `${count_text}在线`;
      liveCountSpan.dataset.rank = JSON.stringify(ranks);
    } else {
      waitDom(".room-info", (liveInfo) => {
        const onlineTextSpan = document.createElement("span");
        onlineTextSpan.textContent = `${count_text}在线`;
        onlineTextSpan.style.fontSize = "12px";
        onlineTextSpan.style.color = "white";
        onlineTextSpan.style.margin = "0 8px";
        onlineTextSpan.id = "live-count-text";
        onlineTextSpan.dataset.rank = JSON.stringify(ranks);
        liveInfo.appendChild(onlineTextSpan);
        liveInfo.addEventListener("click", () => {
          setTimeout(() => {
            const container = document.querySelector(".anchor_popUp");
            const ranks = JSON.parse(document.getElementById("live-count-text").dataset.rank);
            container.insertAdjacentHTML(
              "beforeend",
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
                  .join("")}
                </ol>
                `,
            );
          }, 500);
        });
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

  const style = document.createElement("style");
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
