import type { Child } from "hono/jsx";

import type { VideoInfoData } from "../../../shared/video-info";
import { ArgueSection, InfoCard, PagesCard, PlayerCard } from "./cards";
import { buildShareSearch, upgradeImageUrl } from "./format";
import shareStyles from "./share.css?inline";

const SITE_URL = "https://minibili.tingyuan.in/";
const SITE_NAME = "MiniBili";
const SHARE_TITLE = "B站视频分享 - MiniBili";
const SHARE_DESCRIPTION = "由 MiniBili 提供的轻量 B 站视频分享页";
const ICONIFY_SCRIPT_URL = "https://code.iconify.design/iconify-icon/3.0.2/iconify-icon.min.js";

/**
 * 复制链接与简介展开的渐进增强脚本，直出的内容与分P 链接都不依赖它。
 * 剪贴板不可用（非 https 或旧浏览器）时只更新提示文案。
 */
const SHARE_SCRIPT = `(function () {
  var status = document.querySelector("[data-copy-status]");
  var copyButton = document.querySelector("[data-copy-link]");
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var clipboard = navigator.clipboard;
      var write = clipboard
        ? clipboard.writeText(window.location.href)
        : Promise.reject(new Error("clipboard unavailable"));
      write.then(
        function () {
          if (status) status.textContent = "链接已复制";
        },
        function () {
          if (status) status.textContent = "复制失败，请手动复制地址栏链接";
        },
      );
    });
  }
  var toggle = document.querySelector("[data-desc-toggle]");
  var desc = document.querySelector("[data-desc-text]");
  if (toggle && desc) {
    toggle.addEventListener("click", function () {
      var clamped = desc.classList.toggle("is-clamped");
      toggle.textContent = clamped ? "展开全部" : "收起";
    });
  }
})();`;

interface ShareMeta {
  title: string;
  description: string;
  /** 分享页自身的绝对地址，错误页没有可用地址时为 null */
  canonicalUrl: string | null;
  coverUrl: string | null;
}

interface SiteHeaderProps {
  tagline: string;
}

function SiteHeader(props: SiteHeaderProps) {
  return (
    <header class="site-header">
      <a class="brand" href={SITE_URL}>
        <img class="brand-logo" src="/favicon.svg" alt="" width={28} height={28} />
        <span>{SITE_NAME}</span>
      </a>
      <span class="brand-tagline">{props.tagline}</span>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer class="site-footer">
      <span>
        {"By "}
        <a href={SITE_URL} rel="noreferrer" target="_blank">
          {SITE_NAME}
        </a>
      </span>
    </footer>
  );
}

function ShareHead(props: { meta: ShareMeta }) {
  const { meta } = props;
  return (
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="theme-color" content="#fb7299" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:type" content="video.other" />
      {meta.canonicalUrl ? <link rel="canonical" href={meta.canonicalUrl} /> : null}
      {meta.canonicalUrl ? <meta property="og:url" content={meta.canonicalUrl} /> : null}
      {meta.coverUrl ? <meta property="og:image" content={meta.coverUrl} /> : null}
      {/* 样式内联，分享页不产生额外的样式请求 */}
      <style dangerouslySetInnerHTML={{ __html: shareStyles }}></style>
      <link rel="preconnect" href="https://api.iconify.design" crossorigin="anonymous" />
      <script defer src={ICONIFY_SCRIPT_URL}></script>
    </head>
  );
}

interface ShareShellProps {
  meta: ShareMeta;
  headerTagline: string;
  /** 播放器整块由调用方决定是否渲染 */
  player?: Child;
  children: Child;
}

function ShareShell(props: ShareShellProps) {
  return (
    <html lang="zh-CN">
      <ShareHead meta={props.meta} />
      <body>
        <div id="share-root">
          <SiteHeader tagline={props.headerTagline} />
          <main class="layout">
            {props.player ?? null}
            <div class="scroll-area">
              <div class="content">{props.children}</div>
              <SiteFooter />
            </div>
          </main>
        </div>
        <script dangerouslySetInnerHTML={{ __html: SHARE_SCRIPT }}></script>
      </body>
    </html>
  );
}

export interface SharePageProps {
  data: VideoInfoData;
  page: number;
  /** 分享页所在站点，用于 canonical 与 og:url */
  origin: string;
}

export function SharePage(props: SharePageProps) {
  const { data, page, origin } = props;
  const description = data.desc.trim() || `${data.owner.name}在哔哩哔哩发布的视频`;
  const cover = upgradeImageUrl(data.cover);
  return (
    <ShareShell
      meta={{
        title: `${data.title} - ${SITE_NAME}`,
        description,
        canonicalUrl: `${origin}/share${buildShareSearch(data.bvid, page)}`,
        coverUrl: cover || null,
      }}
      headerTagline="B站视频分享"
      player={<PlayerCard bvid={data.bvid} page={page} />}
    >
      {data.argue ? <ArgueSection argue={data.argue} /> : null}
      <InfoCard data={data} page={page} />
      {data.pages.length > 1 ? <PagesCard data={data} page={page} /> : null}
    </ShareShell>
  );
}

export interface ShareErrorPageProps {
  title: string;
  message: string;
  /** 重新加载指向的地址，失败页不缓存所以刷新一定会重新取数 */
  retryHref: string;
  showSiteLink?: boolean;
}

/** 取数失败时的精简错误页：只有站头站尾与错误卡片，不嵌播放器。 */
export function ShareErrorPage(props: ShareErrorPageProps) {
  return (
    <ShareShell
      meta={{
        title: SHARE_TITLE,
        description: SHARE_DESCRIPTION,
        canonicalUrl: null,
        coverUrl: null,
      }}
      headerTagline="B站视频分享"
    >
      <section class="card state-box">
        <h2 class="state-title">{props.title}</h2>
        <p class="state-text">{props.message}</p>
        <div class="state-actions">
          <a class="button button-primary" href={props.retryHref}>
            重新加载
          </a>
          {props.showSiteLink ? (
            <a class="button" href={SITE_URL} rel="noreferrer" target="_blank">
              访问 MiniBili 官网
            </a>
          ) : null}
        </div>
      </section>
    </ShareShell>
  );
}
