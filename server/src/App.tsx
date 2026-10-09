import { useEffect, useState } from "react";

import type { ReleasesResponse } from "./release.types";

const GITHUB_URL = "https://github.com/lovetingyuan/minibili";
const RELEASES_URL = `${GITHUB_URL}/releases`;
const LATEST_RELEASE_URL = `${RELEASES_URL}/latest`;
const DOWNLOAD_PROXY_URL = "https://ghfast.top";

const screenshots = [
  { src: "/screenshots/hot.webp", alt: "MiniBili 热门视频界面" },
  { src: "/screenshots/dynamic.webp", alt: "MiniBili 关注动态界面" },
  { src: "/screenshots/following.webp", alt: "MiniBili 关注的 UP 主界面" },
  { src: "/screenshots/mine.webp", alt: "MiniBili 我的界面" },
  { src: "/screenshots/player.webp", alt: "MiniBili 视频播放与评论界面" },
  { src: "/screenshots/space.webp", alt: "MiniBili UP 主主页界面" },
] as const;

function isReleasesResponse(value: unknown): value is ReleasesResponse {
  if (!value || typeof value !== "object" || !("data" in value)) {
    return false;
  }
  const data = value.data;
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        "version" in item &&
        typeof item.version === "string",
    )
  );
}

function getDownloadInfo(releaseName: string) {
  const matched = /^minibili-(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)$/i.exec(releaseName);
  if (!matched?.[1]) {
    return null;
  }
  const version = matched[1];
  const assetUrl = `${GITHUB_URL}/releases/download/v${version}/${releaseName}.apk`;
  return { href: `${DOWNLOAD_PROXY_URL}/${assetUrl}`, version: `v${version}` };
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 20h14" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.57 9.57 0 0 1 12 6.84a9.55 9.55 0 0 1 2.5.34c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.6 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function App() {
  const [downloadHref, setDownloadHref] = useState(LATEST_RELEASE_URL);
  const [latestVersion, setLatestVersion] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadLatestRelease() {
      try {
        const response = await fetch("/api/releases", { signal: controller.signal });
        if (!response.ok) {
          return;
        }
        const payload: unknown = await response.json();
        if (!isReleasesResponse(payload)) {
          return;
        }
        const downloadableRelease = payload.data.find((release) =>
          release.version.startsWith("minibili-"),
        );
        if (!downloadableRelease) {
          return;
        }
        const info = getDownloadInfo(downloadableRelease.version);
        if (info) {
          setDownloadHref(info.href);
          setLatestVersion(info.version);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }
    void loadLatestRelease();
    return () => controller.abort();
  }, []);

  return (
    <div>
      <header className="topbar">
        <div className="container topbar-inner">
          <a className="topbar-logo" href="/" aria-label="MiniBili 首页">
            <img src="/minibili-logo.png" alt="MiniBili" width="512" height="512" />
          </a>
          <a className="topbar-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <GitHubIcon />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      <main className="container">
        <section className="hero" aria-labelledby="hero-title">
          <h1 className="hero-title" id="hero-title">
            <img src="/minibili-logo.png" alt="MiniBili" width="512" height="512" />
          </h1>
          <p className="hero-tagline">一款简洁的 B 站 App</p>
          <p className="hero-intro">
            没有推荐、没有广告、没有推送，只有好看的视频和你喜爱的 UP 主。
            <br />
            视频浏览、搜索、播放、弹幕、评论、关注动态与收藏，该有的功能都在。
          </p>
          <a className="download-button" href={downloadHref}>
            <DownloadIcon />
            <span>下载安卓版</span>
            {latestVersion ? <small>{latestVersion}</small> : null}
          </a>
          <p className="hero-note">适用于 Android 6.0 及以上 · 免费开源</p>
        </section>

        <section className="shots" aria-label="界面截图">
          {screenshots.map((screenshot) => (
            <div className="shot" key={screenshot.src}>
              <img src={screenshot.src} alt={screenshot.alt} width="540" height="1200" />
            </div>
          ))}
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <p>MiniBili 是非官方第三方客户端，与哔哩哔哩官方无关。</p>
          <div className="footer-links">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              开源仓库
            </a>
            <a href={RELEASES_URL} target="_blank" rel="noreferrer">
              版本发布
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
