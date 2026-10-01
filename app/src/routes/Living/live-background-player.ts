import type { AppStateStatus } from "react-native";
import type { LivePlayInfo, LiveStreamSource } from "@/api/get-live-url.types";
import { UA } from "@/constants";
import type {
  LiveBackgroundPlayerOptions,
  LiveBackgroundStatus,
  WebPlaybackSnapshot,
} from "./live-playback.types";

export function createLiveBackgroundPlayer(options: LiveBackgroundPlayerOptions) {
  const { player } = options;
  let status: LiveBackgroundStatus = "off";
  let appState = options.appState;
  let snapshot: WebPlaybackSnapshot = { playing: true, muted: false, volume: 1 };
  let sources: LiveStreamSource[] = [];
  let sourceIndex = -1;
  let generation = 0;
  let disposed = false;
  let loading = false;
  let recovering = false;
  let recoveryPending = false;
  let refreshed = false;
  let connected = true;
  let readySince: number | null = null;
  let subscriptions: ReturnType<typeof player.addListener>[] = [];

  function syncWebPage() {
    if (!disposed) {
      options.sendCommand({ status, background: appState !== "active", ...snapshot });
    }
  }

  function setStatus(next: LiveBackgroundStatus) {
    status = next;
    options.onStatus(next);
    syncWebPage();
  }

  function syncAudio() {
    player.volume = snapshot.volume;
    player.muted = appState === "active" || snapshot.muted || !snapshot.playing;
  }

  function disable() {
    generation += 1;
    sources = [];
    sourceIndex = -1;
    loading = false;
    recovering = false;
    recoveryPending = false;
    refreshed = false;
    readySince = null;
    subscriptions.forEach((subscription) => subscription.remove());
    subscriptions = [];
    player.muted = true;
    player.pause();
    player.showNowPlayingNotification = false;
    player.staysActiveInBackground = false;
    // 同步清空来源，避免关闭后的异步 replaceAsync 清空下一次开启的来源。
    player.replace(null, true);
    setStatus("off");
  }

  function fail(message: string) {
    if (disposed || status === "off") {
      return;
    }
    disable();
    options.onError(message);
  }

  function confirmReady() {
    if (
      status !== "off" &&
      !loading &&
      player.status === "readyToPlay" &&
      (player.playing || !snapshot.playing)
    ) {
      recoveryPending = false;
      if (readySince === null && player.playing) {
        readySince = Date.now();
      }
      if (status !== "on") {
        setStatus("on");
      }
      syncAudio();
    }
  }

  async function loadSource(index: number) {
    const source = sources[index];
    if (!source || disposed || status === "off") {
      return false;
    }
    const token = generation;
    sourceIndex = index;
    readySince = null;
    loading = true;
    recoveryPending = false;
    player.muted = true;
    try {
      await player.replaceAsync({
        uri: source.uri,
        contentType: "hls",
        headers: {
          "user-agent": UA,
          origin: "https://live.bilibili.com",
          referer: `https://live.bilibili.com/${options.roomId}`,
        },
        metadata: { title: options.title, artist: "MiniBili" },
      });
      if (disposed || token !== generation) {
        return false;
      }
      if (snapshot.playing) {
        player.play();
      }
      syncAudio();
      return true;
    } catch {
      return false;
    } finally {
      if (!disposed && token === generation) {
        loading = false;
        confirmReady();
      }
    }
  }

  async function recover(refreshFirst = false) {
    if (disposed || status === "off" || recovering) {
      return;
    }
    if (!connected || !snapshot.playing) {
      recoveryPending = true;
      return;
    }
    if (loading) {
      recoveryPending = true;
      return;
    }
    // 短暂 ready 后立即失败的线路仍属于同一轮恢复，不能重置刷新额度。
    if (readySince !== null && Date.now() - readySince >= 10000) {
      refreshed = false;
    }
    readySince = null;
    recovering = true;
    const token = generation;
    try {
      let nextIndex = refreshFirst ? sources.length : sourceIndex + 1;
      while (!disposed && generation === token) {
        if (!connected || !snapshot.playing) {
          recoveryPending = true;
          return;
        }
        if (nextIndex >= sources.length) {
          if (refreshed) {
            fail("后台直播连接失败，请重新开启");
            return;
          }
          refreshed = true;
          const info = await options.refresh();
          if (disposed || generation !== token) {
            return;
          }
          if (!info?.isLive) {
            fail("直播已结束");
            return;
          }
          sources = info.sources;
          nextIndex = 0;
          if (!sources.length) {
            fail("暂无可用的后台直播线路");
            return;
          }
        }
        const loaded = await loadSource(nextIndex);
        if (disposed || generation !== token) {
          return;
        }
        if (loaded && !recoveryPending && player.status !== "error") {
          return;
        }
        nextIndex += 1;
      }
    } catch {
      if (generation === token) {
        if (connected) {
          fail("后台直播连接失败，请重新开启");
        } else {
          recoveryPending = true;
        }
      }
    } finally {
      if (generation === token) {
        recovering = false;
        if (recoveryPending && connected && snapshot.playing) {
          recoveryPending = false;
          void recover();
        }
      }
    }
  }

  function listenToPlayer() {
    subscriptions = [
      player.addListener("statusChange", ({ status: playerStatus }) => {
        if (status === "off") {
          return;
        }
        if (playerStatus === "error") {
          if (loading || recovering) {
            recoveryPending = true;
          } else {
            void recover();
          }
        } else if (playerStatus === "readyToPlay") {
          confirmReady();
        }
      }),
      player.addListener("playingChange", ({ isPlaying }) => {
        if (status === "off" || loading || recovering) {
          return;
        }
        if (player.status === "readyToPlay") {
          if (isPlaying) {
            snapshot = { ...snapshot, playing: true };
            confirmReady();
            syncWebPage();
          } else if (status === "on") {
            // 媒体通知暂停或音频焦点中断；不能作为断流强制恢复。
            snapshot = { ...snapshot, playing: false };
            syncWebPage();
          }
        }
      }),
      player.addListener("playToEnd", () => {
        if (snapshot.playing) {
          void recover(true);
        }
      }),
    ];
  }

  return {
    syncWebPage,
    fail,
    setMuted(muted: boolean) {
      snapshot = { ...snapshot, muted };
      if (status !== "off") {
        syncAudio();
      }
      syncWebPage();
    },
    setEnabled(enabled: boolean) {
      if (!enabled) {
        disable();
        return;
      }
      if (status !== "off" || appState !== "active") {
        syncWebPage();
        return;
      }
      generation += 1;
      snapshot = { ...snapshot, playing: true };
      listenToPlayer();
      player.muted = true;
      player.staysActiveInBackground = true;
      player.showNowPlayingNotification = true;
      setStatus("preparing");
    },
    setSources(info: LivePlayInfo) {
      if (status !== "off" && sourceIndex < 0 && !loading && !recovering) {
        if (!info.isLive || !info.sources.length) {
          fail(info.isLive ? "暂无可用的后台直播线路" : "直播已结束");
          return;
        }
        sources = info.sources;
        void recover();
      }
    },
    updateSnapshot(next: WebPlaybackSnapshot) {
      // Chromium 在切后台、交接音频焦点时发出的暂停消息可能晚于 AppState。
      // 这些消息不是用户操作，不能覆盖进入后台前保存的播放意图。
      if (appState !== "active") {
        return;
      }
      snapshot = next;
      if (status === "off") {
        return;
      }
      syncAudio();
      if (!next.playing) {
        player.pause();
      } else if (player.status === "error" || recoveryPending) {
        refreshed = false;
        void recover(true);
      } else if (sourceIndex >= 0 && !loading) {
        player.play();
      }
    },
    setAppState(next: AppStateStatus) {
      appState = next;
      if (status !== "off") {
        // 返回前台先静音原生；切后台先暂停网页，再交给原生输出声音。
        if (next === "active") {
          syncAudio();
          syncWebPage();
        } else {
          syncWebPage();
          syncAudio();
        }
        const expiresAt = sources[sourceIndex]?.expiresAt;
        if (expiresAt && expiresAt <= Date.now()) {
          void recover(true);
        }
      }
    },
    setNetworkConnected(next: boolean) {
      const recovered = !connected && next;
      connected = next;
      if (recovered && status !== "off" && (player.status === "error" || recoveryPending)) {
        refreshed = false;
        void recover(true);
      }
    },
    addressFetchFailed() {
      if (connected) {
        fail("后台直播地址获取失败，请重试");
      } else {
        recoveryPending = true;
      }
    },
    dispose() {
      disable();
      disposed = true;
    },
  };
}
