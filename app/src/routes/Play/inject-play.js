function __$hack() {
  const style = document.createElement("style");
  style.textContent = `
  body[data-replaced] .mplayer-time-total-text {
    font-weight: bold!important;
    font-size: 14px!important;
  }

  html, body, #bilibiliPlayer, .mplayer {
    background-color: black!important;
  }
  .b-danmaku {
    opacity: 0.66!important;
  }
  .mplayer-control-bar-top {
    align-items: center;
  }
    @keyframes videoDetected {
  from { opacity: 0.99; }
  to { opacity: 1; }
}

video {
  /* 只要 video 元素出现在 DOM 中，就会触发这个微小的动画 */
  animation-duration: 0.001s;
  animation-name: videoDetected;
}
  `;
  document.head.appendChild(style);

  document.addEventListener("visibilitychange", () => {
    const bgPlayBtn = document.getElementById("play-background-button");
    if (!bgPlayBtn || bgPlayBtn.dataset.bgPlay !== "true") {
      return;
    }
    if (document.visibilityState === "hidden") {
      const video = document.querySelector("video");
      setTimeout(() => {
        if (video.paused) {
          video.muted = true;
          video.play();
          setTimeout(() => {
            video.muted = false;
          });
        }
      });
      bgPlayBtn.dataset.bgPlay = "false";
    }
  });

  const postMessage = (action, payload) => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        action,
        payload,
      }),
    );
  };

  const reportPlayTime = (lastTime, duration) => {
    if (!Number.isFinite(lastTime) || !Number.isFinite(duration) || duration <= 0) {
      return;
    }
    postMessage("reportPlayTime", Number.parseFloat(((lastTime * 100) / duration).toFixed(1)));
  };

  window.reportPlayTime = () => {
    const video = document.querySelector("video");
    if (!video) {
      return;
    }
    reportPlayTime(video.currentTime, video.duration);
  };

  const setupVideo = (video) => {
    if (!video || video.tagName !== "VIDEO" || video.dataset.handled === "true") {
      return;
    }

    video.dataset.handled = "true";

    const syncPlayTime = () => {
      reportPlayTime(video.currentTime, video.duration);
    };

    ["play", "ended", "pause"].forEach((evt) => {
      video.addEventListener(evt, () => {
        postMessage("playState", evt);
        if (evt === "play") {
          setTimeout(syncPlayTime, 3000);
        } else {
          syncPlayTime();
        }
        if (evt === "ended") {
          const rateBtn = document.getElementById("play-rate-button");
          if (rateBtn) {
            rateBtn.dataset.rate = `1${xx}`;
            rateBtn.textContent = `1${xx}`;
          }
          video.playbackRate = 1;
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        }
      });
    });

    ["timeupdate", "seeking"].forEach((evt) => {
      video.addEventListener(evt, () => {
        if (evt === "seeking") {
          syncPlayTime();
        }
      });
    });
  };

  const scanVideos = (node) => {
    if (!node) {
      return;
    }
    if (node.tagName === "VIDEO") {
      setupVideo(node);
      return;
    }
    if (typeof node.querySelectorAll === "function") {
      node.querySelectorAll("video").forEach(setupVideo);
    }
  };

  document.addEventListener(
    "animationstart",
    function (event) {
      if (event.animationName === "videoDetected" && event.target?.tagName === "VIDEO") {
        setupVideo(event.target);
      }
    },
    true,
  );

  const startVideoObserver = () => {
    const root = document.body || document.documentElement;
    if (!root) {
      return;
    }

    scanVideos(root);

    if (!window.MutationObserver) {
      return;
    }

    const observer = new window.MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          scanVideos(node);
        });
      });
    });

    observer.observe(root, { childList: true, subtree: true });
  };

  if (document.body || document.documentElement) {
    startVideoObserver();
  } else {
    window.addEventListener("DOMContentLoaded", startVideoObserver, { once: true });
  }

  function waitForDom(selectors, callback) {
    if (typeof selectors === "string") {
      selectors = [selectors];
    }
    const fn = () => {
      const doms = selectors.map((s) => document.querySelector(s)).filter(Boolean);
      if (doms.length === selectors.length) {
        clearInterval(timer);
        callback(...doms);
      }
    };
    const timer = setInterval(fn, 100);
    fn();
    setTimeout(() => {
      clearInterval(timer);
    }, 10000);
  }

  const queryFirst = (selectors) => {
    for (const selector of selectors) {
      const dom = document.querySelector(selector);
      if (dom) {
        return dom;
      }
    }
    return null;
  };

  const getTimelineDoms = () => {
    return {
      current: queryFirst([".mplayer-time-current-text", ".gsl-timeline-time"]),
      total: queryFirst([".mplayer-time-total-text", ".gsl-timeline-duration"]),
    };
  };

  const isFullscreen = () =>
    !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

  const xx = "x";
  waitForDom(".mplayer-display, .gsl-inner", (container) => {
    container.addEventListener("dblclick", (evt) => {
      if (evt.target.matches(".mplayer-right *, .gsl-control-right *")) {
        return;
      }
      const video = document.querySelector("video[src]");
      if (!video) {
        return;
      }
      video.pause();
    });
  });

  waitForDom(".mplayer-right, .gsl-control-right", (right) => {
    if (!document.getElementById("play-rate-button")) {
      const rateBtn = document.createElement("div");
      rateBtn.id = "play-rate-button";
      rateBtn.innerHTML = `1${xx}`;
      rateBtn.dataset.rate = "1";
      rateBtn.style.cssText = `
        width: 24px;
        height: 24px;
        color: white;
        font-size: 16px;
        line-height: 28px;
        text-align: center;
        background: rgba(0,0,0,.2);
        border-radius: 50%;
      `;
      rateBtn.addEventListener("click", () => {
        const video = document.querySelector("video");
        if (!video) {
          return;
        }
        let rate = rateBtn.dataset.rate - 0;
        if (rate === 1) {
          rate = 2;
        } else if (rate === 2) {
          rate = 3;
        } else if (rate === 3) {
          rate = 5;
        } else if (rate === 5) {
          rate = 1;
        }
        rateBtn.dataset.rate = rate;
        rateBtn.textContent = rate + xx;
        video.playbackRate = rate;
      });
      right.appendChild(rateBtn);
    }
    if (!document.getElementById("play-background-button")) {
      const bgPlayBtn = document.createElement("div");
      bgPlayBtn.id = "play-background-button";
      bgPlayBtn.innerHTML = `后<style>
        #play-background-button[data-bg-play="true"] {
          color: #FF6699!important;font-weight: bold;
        }
        #play-background-button {
          width: 24px;
          height: 24px;
          color: white;
          font-size: 16px;
          line-height: 28px;
          text-align: center;
          margin-top: 10px;
          background: rgba(0,0,0,.2);
          border-radius: 50%;
        }</style>
      `.trim();
      bgPlayBtn.addEventListener("click", () => {
        if (bgPlayBtn.dataset.bgPlay === "true") {
          bgPlayBtn.dataset.bgPlay = "false";
        } else {
          bgPlayBtn.dataset.bgPlay = "true";
          postMessage("showToast", "后台播放已开启");
        }
      });
      right.appendChild(bgPlayBtn);
    }
  });

  const aa = (element) => {
    let startX = 0;
    let startY = 0;
    let distanceX = 0;
    let distanceY = 0;
    let direction = "";
    let gestureHandled = false;

    let touchTimer;
    const isVideoPlaying = (video) =>
      !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
    const touchEventOptions = { capture: true, passive: true };

    const resetRate = (video) => {
      if (video && video.dataset.longPress === "true") {
        video.playbackRate = 1;
        video.dataset.longPress = "false";
        const rateBtn = document.getElementById("play-rate-button");
        if (rateBtn) {
          rateBtn.dataset.rate = "1";
          rateBtn.textContent = `1${xx}`;
        }
      }
    };

    const clearGesture = () => {
      startX = 0;
      startY = 0;
      distanceX = 0;
      distanceY = 0;
      direction = "";
      gestureHandled = false;
    };

    const finalizeGesture = () => {
      clearTimeout(touchTimer);
      const video = document.querySelector("video");
      resetRate(video);
      if (gestureHandled) {
        clearGesture();
        return;
      }
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        direction = distanceX < 0 ? "left" : "right";
      } else {
        direction = distanceY < 0 ? "up" : "down";
      }

      const { current, total } = getTimelineDoms();
      const time1 = current?.getBoundingClientRect();
      const time2 = total?.getBoundingClientRect();

      if (time1 && time2 && video) {
        const { x: x1, y: y1 } = time1;
        const { x: x2, y: y2 } = time2;
        if (Math.abs(x1 - x2) < 5 && Math.abs(distanceY) > 70) {
          // fullscreen
          if (y1 > y2) {
            // up -> forward, down -> backward
            video.currentTime += direction === "down" ? -5 : 5;
          } else {
            video.currentTime += direction === "up" ? -5 : 5;
          }
        }
        if (Math.abs(y1 - y2) < 5) {
          if (x1 < x2) {
            if ((direction === "left" || direction === "right") && Math.abs(distanceX) > 70) {
              video.currentTime += direction === "left" ? -5 : 5;
            }
          } else {
            // TODO:
          }
        }
      }

      clearGesture();
    };

    element.addEventListener(
      "touchstart",
      (event) => {
        gestureHandled = false;
        touchTimer = setTimeout(() => {
          const video = document.querySelector("video");
          if (video && isVideoPlaying(video)) {
            video.playbackRate = 3;
            video.dataset.longPress = "true";
            postMessage("showToast", "3倍速播放");
          }
        }, 1000);
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
      },
      touchEventOptions,
    );

    element.addEventListener(
      "touchmove",
      (event) => {
        const touch = event.touches[0];
        distanceX = touch.clientX - startX;
        distanceY = touch.clientY - startY;

        if (
          !gestureHandled &&
          !isFullscreen() &&
          Math.abs(distanceY) > 96 &&
          Math.abs(distanceY) > Math.abs(distanceX) + 24
        ) {
          gestureHandled = true;
          clearTimeout(touchTimer);
          postMessage("change-video-height", distanceY < 0 ? "up" : "down");
        }
      },
      touchEventOptions,
    );

    element.addEventListener("touchend", finalizeGesture, true);

    element.addEventListener(
      "touchcancel",
      () => {
        clearTimeout(touchTimer);
        resetRate(document.querySelector("video"));
        clearGesture();
      },
      true,
    );
  };
  aa(document);
}

export const INJECTED_JAVASCRIPT = `(${__$hack})();\ntrue;`;
