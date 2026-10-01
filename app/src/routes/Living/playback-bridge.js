function __$installLivePlaybackBridge() {
  if (window.__minibiliLivePlayback) {
    return;
  }
  const roomId = window.location.pathname.match(/^\/(?:h5\/)?(\d+)/)?.[1] || "";
  let state = { status: "off", background: false, playing: true };
  let snapshot = { playing: true, muted: false, volume: 1 };
  let video = null;

  const post = (message) => {
    window.ReactNativeWebView?.postMessage(JSON.stringify({ ...message, roomId }));
  };
  const renderButton = () => {
    const button = document.getElementById("live-background-button");
    if (button) {
      button.dataset.backgroundPlay = state.status === "on" ? "true" : "false";
      const label = state.status === "preparing" ? "准备中" : "后台播放";
      if (button.textContent !== label) {
        button.textContent = label;
      }
      button.setAttribute("aria-pressed", String(state.status === "on"));
    }
    const muteButton = document.getElementById("live-mute-button");
    if (muteButton) {
      const label = snapshot.muted ? "开声" : "静音";
      if (muteButton.textContent !== label) {
        muteButton.textContent = label;
      }
      muteButton.setAttribute("aria-pressed", String(snapshot.muted));
    }
  };
  const reportSnapshot = () => {
    if (!video || state.status !== "off" || state.background || document.hidden) {
      return;
    }
    // App 暂未开放网页的播放控制；仅开启前读取初始值，开启后以媒体通知为准。
    snapshot = { playing: !video.paused && !video.ended, muted: video.muted, volume: video.volume };
    post({ action: "live-playback-state", payload: snapshot });
  };
  const applyPlayback = (resume) => {
    if (!video) {
      return;
    }
    if (state.background && state.status !== "off") {
      video.muted = true;
      video.pause();
    } else {
      video.volume = snapshot.volume;
      video.muted = snapshot.muted;
      if (!state.playing) {
        video.pause();
      } else if (resume && video.paused) {
        // 前台交接只恢复一次；拒绝播放时保留网页自己的播放按钮。
        video.play()?.catch(() => {});
      }
    }
  };
  const bindVideo = () => {
    const next = document.querySelector("video");
    if (next === video) {
      renderButton();
      return;
    }
    video = next;
    if (video) {
      if (state.status === "off" && !state.background) {
        reportSnapshot();
      } else {
        applyPlayback(!state.background);
      }
    }
  };

  window.__minibiliLivePlayback = {
    requestMute() {
      if (state.background) {
        return;
      }
      snapshot.muted = !snapshot.muted;
      if (video) {
        video.muted = snapshot.muted;
      }
      renderButton();
      post({ action: "live-mute", muted: snapshot.muted });
    },
    request() {
      reportSnapshot();
      post({ action: "background-play", enabled: state.status === "off" });
    },
    update(next) {
      const resume = (state.background && !next.background) || (!state.playing && next.playing);
      const wasEnabled = state.status !== "off";
      state = next;
      if (next.status !== "off" || wasEnabled) {
        snapshot = { playing: next.playing, muted: next.muted, volume: next.volume };
      }
      bindVideo();
      if (next.status !== "off" || wasEnabled) {
        applyPlayback(resume);
      }
      renderButton();
    },
  };
  // 仅绑定前台播放状态和新增的视频节点，不在后台恢复播放或运行保活任务。
  const observer = new MutationObserver(bindVideo);
  observer.observe(document.documentElement || document, { childList: true, subtree: true });
  window.addEventListener(
    "pagehide",
    () => {
      observer.disconnect();
    },
    { once: true },
  );
  bindVideo();
  post({ action: "live-page-ready" });
}

export const LIVE_PLAYBACK_BRIDGE_SCRIPT = `(${__$installLivePlaybackBridge})();true;`;
