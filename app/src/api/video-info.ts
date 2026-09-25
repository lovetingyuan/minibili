import useSWR from "swr";
import type { z } from "zod";

import request from "./fetcher";
import type { VideoInfoResponseSchema } from "./video-info.schema";

type VideoInfoResponse = z.infer<typeof VideoInfoResponseSchema>;

const getVideoInfo = (data: VideoInfoResponse) => {
  return {
    aid: data.aid,
    cid: data.cid,
    bvid: data.bvid,
    date: data.pubdate,
    desc: data.desc,
    descriptionNodes: (data.desc_v2 ?? []).map((node) => ({
      rawText: node.raw_text,
      type: node.type,
      bizId: node.biz_id,
    })),
    cover: data.pic,
    mid: data.owner.mid,
    name: data.owner.name,
    face: data.owner.face,
    title: data.title,
    // --------------------
    width: data.dimension.width,
    height: data.dimension.height,
    rotate: data.dimension.rotate,
    duration: data.duration,
    likeNum: data.stat.like,
    replyNum: data.stat.reply,
    shareNum: data.stat.share,
    playNum: data.stat.view,
    collectNum: data.stat.favorite,
    danmuNum: data.stat.danmaku,
    videos: data.videos, // 如果是分片视频或者互动视频，这个videos会是大于1的数字
    tag: data.tname,
    interactive: data.rights.is_stein_gate === 1,
    cooperation: data.rights.is_cooperation === 1,
    argument: data.argue_info.argue_msg,
    argumentLink: data.argue_info.argue_link,
    // 番剧/影视等 PGC 内容只能跳回 B站 观看，这里保留跳转地址
    redirectUrl: data.redirect_url ?? "",
    // 充电专属视频：拿不到完整播放地址时只有试看片段，或者直接不给地址（code 87008）
    isUpowerExclusive: data.is_upower_exclusive === true,
    // 付费标记只用来解释受限原因，能不能播仍然以播放地址为准
    payRights: {
      arcPay: data.rights.arc_pay ?? 0,
      pay: data.rights.pay ?? 0,
      ugcPay: data.rights.ugc_pay ?? 0,
    },
    state: data.state,
    // location: data.pub_location,
    pages: data.pages.map((v) => {
      // 如果是分片视频，那么length会是分片数量，否则是1
      return {
        width: v.dimension.width,
        height: v.dimension.height,
        duration: v.duration,
        cover: v.first_frame,
        title: v.part,
        page: v.page,
        cid: v.cid,
      };
    }),
  };
};

export type VideoInfo = ReturnType<typeof getVideoInfo>;
export type VideoDescriptionNode = VideoInfo["descriptionNodes"][number];
// https://api.bilibili.com/x/web-interface/view?aid=336141511
export function useVideoInfo(bvid: string) {
  const { data, error, isLoading } = useSWR<VideoInfoResponse>(
    bvid ? `/x/web-interface/view?bvid=${bvid}` : null,
    request,
  );
  return {
    data: data ? getVideoInfo(data) : null,
    error,
    isLoading,
  };
}
