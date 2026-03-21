const releaseApiUrl = "/api/releases";
const githubRepoUrl = "https://github.com/lovetingyuan/minibili";
const proxyHost = "https://ghfast.top";
const buildFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Shanghai",
});

const screenshots = ["/video-list.jpg", "/player.jpg", "/up-list.jpg", "/up-detail.jpg"];

const downloadLink = document.getElementById("download-link");
const downloadMeta = document.getElementById("download-meta");
const downloadStatus = document.getElementById("download-status");
const buildTime = document.getElementById("build-time");
const changelogDialog = document.getElementById("changelog-dialog");
const changelogBody = document.getElementById("changelog-body");
const openChangelogButton = document.getElementById("open-changelog");
const carouselImage = document.getElementById("carousel-image");
const prevButton = document.getElementById("carousel-prev");
const nextButton = document.getElementById("carousel-next");

let changelogCache = null;
let activeIndex = 0;

function withTimeout(url, timeout) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  return fetch(url, { signal: controller.signal }).finally(() => {
    window.clearTimeout(timer);
  });
}

async function requestJson(url, timeout, retryCount) {
  let lastError = null;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await withTimeout(url, timeout);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Request failed");
}

function renderBuildTime() {
  const formatted = buildFormatter.format(new Date());
  buildTime.textContent = formatted;
  buildTime.dateTime = new Date().toISOString();
}

function setDownloadState({
  href = "/",
  versionLabel = "获取版本中",
  helperText = "正在获取最新版本，请稍候",
  disabled = true,
  loading = false,
}) {
  downloadLink.href = href;
  downloadLink.setAttribute("aria-disabled", String(disabled));
  downloadLink.tabIndex = disabled ? -1 : 0;
  downloadMeta.textContent = versionLabel;
  downloadStatus.textContent = helperText;
  downloadLink.classList.toggle("is-loading", loading);
}

async function loadLatestRelease() {
  setDownloadState({ loading: true });

  try {
    const payload = await requestJson(releaseApiUrl, 20_000, 5);
    if (payload.code !== 0 || !Array.isArray(payload.data) || payload.data.length === 0) {
      throw new Error("Invalid release payload");
    }

    const latest = payload.data[0];
    const version = latest.version.split("-")[1];
    const fileName = `${latest.version}.apk`;
    const apkUrl = `${proxyHost}/${githubRepoUrl}/releases/download/v${version}/${fileName}`;

    downloadLink.download = `minibili-${version}.apk`;
    setDownloadState({
      href: apkUrl,
      versionLabel: `(${version})`,
      helperText: "点击后开始下载最新 APK",
      disabled: false,
      loading: false,
    });
  } catch (error) {
    console.error(error);
    setDownloadState({
      versionLabel: "暂不可用",
      helperText: "最新版本加载失败，请稍后重试",
      disabled: true,
      loading: false,
    });
  }
}

function releaseToItem(release) {
  const changelogs = String(release.changelog ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    version: String(release.version ?? "").split("-")[1] ?? String(release.version ?? ""),
    date: String(release.date ?? "").split("T")[0] || "未知日期",
    changelogs,
  };
}

function renderChangeLogs(logs) {
  if (logs.length === 0) {
    changelogBody.innerHTML = '<p class="dialog-state">暂无更新日志。</p>';
    return;
  }

  const list = document.createElement("ul");
  list.className = "changelog-list";

  for (const log of logs) {
    const item = document.createElement("li");
    item.className = "changelog-item";

    const header = document.createElement("div");
    header.className = "changelog-header";

    const version = document.createElement("strong");
    version.className = "changelog-version";
    version.textContent = log.version;

    const date = document.createElement("time");
    date.className = "changelog-date";
    date.textContent = log.date;

    header.append(version, date);

    const points = document.createElement("ul");
    points.className = "changelog-points";

    for (const changelog of log.changelogs) {
      const point = document.createElement("li");
      point.textContent = changelog;
      points.append(point);
    }

    item.append(header, points);
    list.append(item);
  }

  changelogBody.replaceChildren(list);
}

async function openChangeLog() {
  if (typeof changelogDialog.showModal === "function") {
    changelogDialog.showModal();
  } else {
    changelogDialog.setAttribute("open", "true");
  }

  if (changelogCache) {
    renderChangeLogs(changelogCache);
    return;
  }

  changelogBody.innerHTML = '<p class="dialog-state">更新日志加载中...</p>';

  try {
    const payload = await requestJson(releaseApiUrl, 20_000, 5);
    if (payload.code !== 0 || !Array.isArray(payload.data)) {
      throw new Error("Invalid changelog payload");
    }

    changelogCache = payload.data.map(releaseToItem);
    renderChangeLogs(changelogCache);
  } catch (error) {
    console.error(error);
    changelogBody.innerHTML = '<p class="dialog-state">更新日志加载失败，请稍后重试。</p>';
  }
}

function syncCarouselFromHash() {
  const match = window.location.hash.match(/^#screenshot-(\d+)$/);
  const nextIndex = match ? Number(match[1]) : 0;

  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= screenshots.length) {
    activeIndex = 0;
  } else {
    activeIndex = nextIndex;
  }

  carouselImage.src = screenshots[activeIndex];
}

function moveCarousel(offset) {
  const nextIndex = (activeIndex + offset + screenshots.length) % screenshots.length;
  window.location.hash = `screenshot-${nextIndex}`;
}

function init() {
  renderBuildTime();
  syncCarouselFromHash();
  loadLatestRelease();

  openChangelogButton.addEventListener("click", openChangeLog);
  prevButton.addEventListener("click", () => moveCarousel(-1));
  nextButton.addEventListener("click", () => moveCarousel(1));
  window.addEventListener("hashchange", syncCarouselFromHash);
}

init();
