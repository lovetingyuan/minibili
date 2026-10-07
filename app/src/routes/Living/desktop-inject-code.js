import { LIVE_PLAYBACK_BRIDGE_SCRIPT } from "./playback-bridge";

function enableDesktopZoom() {
  if (window.__minibiliDesktopZoomInitialized) {
    return;
  }
  window.__minibiliDesktopZoomInitialized = true;

  // 保留桌面布局宽度，并覆盖网页的缩放限制，允许双指缩放。
  const content = "width=1280, user-scalable=yes, minimum-scale=0.1, maximum-scale=5";
  const updateViewport = () => {
    if (!document.head) {
      return;
    }
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head.appendChild(viewport);
    }
    if (viewport.content !== content) {
      viewport.content = content;
    }
  };

  const observeViewport = () => {
    updateViewport();
    // 只观察 head，避免直播弹幕的频繁 DOM 更新触发；比较内容避免循环。
    const observer = new MutationObserver(updateViewport);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["content"],
    });
  };
  if (document.head) {
    observeViewport();
  } else {
    window.addEventListener("DOMContentLoaded", observeViewport, { once: true });
  }
}

export const DESKTOP_INJECTED_JAVASCRIPT = `${LIVE_PLAYBACK_BRIDGE_SCRIPT}(${enableDesktopZoom})();true;`;
