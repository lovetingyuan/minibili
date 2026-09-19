import type { Child } from 'hono/jsx';

import type { VideoInfoArgue, VideoInfoData, VideoInfoOwner } from '../../../shared/video-info';
import {
  buildPlayerUrl,
  buildShareSearch,
  buildSourceUrl,
  formatCount,
  formatDate,
  formatDuration,
  upgradeImageUrl,
} from './format';

const DESC_MAX_LENGTH = 160;

/**
 * MDI 图标在同一个 24 网格里实际绘制范围并不一致（高度 15～22 个单位），
 * 全部按 1em 渲染时同一行会出现明显的大小差。这里按图标写死 width/height，
 * 让会并排比较的图标视觉高度对齐（数值 ≈ 19.8 ÷ 图标实际墨迹高度）。
 */
const ICON_SIZES: Record<string, string> = {
  'mdi:account-group-outline': '1.2em',
  'mdi:calendar-clock-outline': '0.9em',
  'mdi:circle-multiple-outline': '1.2em',
  'mdi:comment-text-multiple-outline': '0.9em',
  'mdi:content-copy': '0.9em',
  'mdi:open-in-new': '1.1em',
  'mdi:playlist-play': '1.3em',
  'mdi:share-outline': '1.3em',
  'mdi:star-outline': '1.05em',
};

interface IconProps {
  name: string;
}

function Icon(props: IconProps) {
  const size = ICON_SIZES[props.name] ?? '1em';
  return (
    <iconify-icon
      icon={props.name}
      width={size}
      height={size}
      style={`--icon-size:${size}`}
      aria-hidden="true"
    ></iconify-icon>
  );
}

interface IconTextProps {
  icon: string;
  label: string;
}

/** 图标 + 默认隐藏的文字标签，图标不可用时自动显示名称。 */
function IconText(props: IconTextProps) {
  return (
    <>
      <Icon name={props.icon} />
      <span class="icon-fallback">{props.label}</span>
    </>
  );
}

interface ExternalLinkProps {
  class: string;
  href: string;
  children: Child;
}

function ExternalLink(props: ExternalLinkProps) {
  return (
    <a class={props.class} href={props.href} rel="noreferrer" target="_blank">
      {props.children}
    </a>
  );
}

interface PlayerCardProps {
  bvid: string;
  page: number;
}

export function PlayerCard(props: PlayerCardProps) {
  return (
    <section class="card player-card">
      <div class="player-frame">
        <iframe
          id="player"
          class="player"
          title="哔哩哔哩播放器"
          src={buildPlayerUrl(props.bvid, props.page)}
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </section>
  );
}

interface ArgueSectionProps {
  argue: VideoInfoArgue;
}

/** argue 提示紧贴播放器下方，没有内容时不渲染。 */
export function ArgueSection(props: ArgueSectionProps) {
  return (
    <section class="card argue">
      <IconText icon="mdi:alert-outline" label="提示" />
      <span class="argue-text">{props.argue.message}</span>
      {props.argue.link ? (
        <ExternalLink class="argue-link" href={props.argue.link}>
          查看详情
        </ExternalLink>
      ) : null}
    </section>
  );
}

interface OwnerRowProps {
  owner: VideoInfoOwner;
}

function OwnerRow(props: OwnerRowProps) {
  const { owner } = props;
  return (
    <div class="owner-row">
      <img
        class="avatar"
        alt={`${owner.name} 的头像`}
        loading="lazy"
        referrerpolicy="no-referrer"
        src={owner.face ? upgradeImageUrl(owner.face) : '/favicon.svg'}
      />
      <div class="owner-info">
        <ExternalLink class="owner-name" href={`https://space.bilibili.com/${owner.mid}`}>
          {owner.name}
        </ExternalLink>
        <span class="owner-fans">
          <span>{owner.fans === null ? '粉丝数未知' : `${formatCount(owner.fans)}粉丝`}</span>
        </span>
      </div>
    </div>
  );
}

interface MetaRowProps {
  data: VideoInfoData;
  page: number;
}

function MetaRow(props: MetaRowProps) {
  const { data, page } = props;
  const items: { icon: string; label: string; value: string }[] = [];
  if (data.pubdate) {
    items.push({
      icon: 'mdi:calendar-clock-outline',
      label: '投稿',
      value: formatDate(data.pubdate),
    });
  }
  if (data.pages.length > 1) {
    items.push({
      icon: 'mdi:playlist-play',
      label: '分P',
      value: `${page}/${data.pages.length}`,
    });
  }
  if (data.tname) {
    items.push({ icon: 'mdi:tag-outline', label: '分区', value: data.tname });
  }
  // 切换分P 后按当前分片取值，拿不到时退回整部视频的时长
  const duration = data.pages[page - 1]?.duration ?? data.duration;
  items.push({
    icon: 'mdi:clock-outline',
    label: '时长',
    value: formatDuration(duration || data.duration),
  });

  return (
    <div class="meta-row">
      {items.map((item) => (
        <span class="meta-item" key={item.label}>
          <IconText icon={item.icon} label={item.label} />
          {item.value}
        </span>
      ))}
    </div>
  );
}

interface StatsRowProps {
  data: VideoInfoData;
}

/** 播放数据：一行图标 + 数字，不用卡片。 */
function StatsRow(props: StatsRowProps) {
  const { stat } = props.data;
  const items: { icon: string; label: string; value: number }[] = [
    { icon: 'mdi:play-circle-outline', label: '播放', value: stat.view },
    { icon: 'mdi:comment-text-multiple-outline', label: '弹幕', value: stat.danmaku },
    { icon: 'mdi:thumb-up-outline', label: '点赞', value: stat.like },
    { icon: 'mdi:circle-multiple-outline', label: '投币', value: stat.coin },
    { icon: 'mdi:star-outline', label: '收藏', value: stat.favorite },
    { icon: 'mdi:share-outline', label: '转发', value: stat.share },
    { icon: 'mdi:comment-outline', label: '评论', value: stat.reply },
  ];

  return (
    <div class="stats">
      {items.map((item) => {
        const text = formatCount(item.value);
        return (
          <span class="stat" title={`${item.label} ${text}`} key={item.label}>
            <IconText icon={item.icon} label={item.label} />
            <span class="stat-value">{text}</span>
          </span>
        );
      })}
    </div>
  );
}

interface ActionRowProps {
  data: VideoInfoData;
  page: number;
}

/** 复制链接依赖页尾的内联脚本，脚本被拦截时按钮不产生副作用。 */
function ActionRow(props: ActionRowProps) {
  return (
    <div class="action-row">
      <button class="button" type="button" data-copy-link>
        <Icon name="mdi:content-copy" />
        复制链接
      </button>
      <ExternalLink class="button" href={buildSourceUrl(props.data.bvid, props.page)}>
        <Icon name="mdi:open-in-new" />在 B 站打开
      </ExternalLink>
      <span class="copy-status" data-copy-status></span>
    </div>
  );
}

interface DescBlockProps {
  text: string;
}

function DescBlock(props: DescBlockProps) {
  if (props.text.length <= DESC_MAX_LENGTH) {
    return (
      <div class="desc">
        <p class="desc-text" data-desc-text>
          {props.text}
        </p>
      </div>
    );
  }
  // 长简介默认折叠，展开状态由页尾脚本切换
  return (
    <div class="desc">
      <p class="desc-text is-clamped" data-desc-text>
        {props.text}
      </p>
      <button class="desc-toggle" type="button" data-desc-toggle>
        展开全部
      </button>
    </div>
  );
}

/** 简介为空或与标题重复时整块不渲染。 */
function getDescText(data: VideoInfoData) {
  const desc = data.desc.trim();
  return !desc || desc === data.title.trim() ? null : desc;
}

interface InfoCardProps {
  data: VideoInfoData;
  page: number;
}

export function InfoCard(props: InfoCardProps) {
  const desc = getDescText(props.data);
  return (
    <section class="card">
      <div class="info">
        <OwnerRow owner={props.data.owner} />
        <h1 class="video-title">{props.data.title}</h1>
        <MetaRow data={props.data} page={props.page} />
        <StatsRow data={props.data} />
        <ActionRow data={props.data} page={props.page} />
        {desc ? <DescBlock text={desc} /> : null}
      </div>
    </section>
  );
}

interface PagesCardProps {
  data: VideoInfoData;
  page: number;
}

/** 分P 列表用真实链接，无脚本也能切换。 */
export function PagesCard(props: PagesCardProps) {
  const { data, page } = props;
  return (
    <section class="card pages-card">
      <h2 class="card-title">
        <IconText icon="mdi:playlist-play" label="分P" />
        {`分P列表（${data.pages.length}）`}
      </h2>
      <div class="page-list">
        {data.pages.map((part) => (
          <a
            key={part.page}
            class={part.page === page ? 'page-item is-active' : 'page-item'}
            href={`/share${buildShareSearch(data.bvid, part.page)}`}
            aria-current={part.page === page ? 'page' : undefined}
          >
            <span class="page-index">{`P${part.page}`}</span>
            <span class="page-title">{part.part || `第 ${part.page} P`}</span>
            <span class="page-duration">{formatDuration(part.duration)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
