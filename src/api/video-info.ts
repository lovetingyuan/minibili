import useSWR from 'swr'
import { z } from 'zod'
import { VideoInfoResponseSchema } from './video-info.schema'

export type VideoInfoResponse = z.infer<typeof VideoInfoResponseSchema>

const getVideoItem = (data: VideoInfoResponse) => {
  return {
    aid: data.aid,
    bvid: data.bvid,
    // cid: data.cid,
    // copyright: number;
    pubTime: data.pubdate,
    desc: data.desc,
    // desc_v2: [{…}]
    width: data.dimension.width,
    height: data.dimension.height,
    rotate: data.dimension.rotate,
    duration: data.duration,
    mid: data.owner.mid,
    upName: data.owner.name,
    upFace: data.owner.face,
    title: data.title,
    likeNum: data.stat.like,
    replyNum: data.stat.reply,
    shareNum: data.stat.share,
    viewNum: data.stat.view,
    cover: data.pic,
    videosNum: data.pages?.length || 0,
    videos: data.videos,
    tname: data.tname,
    pages: data.pages?.map(v => {
      return {
        width: v.dimension.width,
        height: v.dimension.height,
        // cid: v.cid,
        title: v.part,
        page: v.page,
      }
    }),
  }
}
export type VideoInfo = ReturnType<typeof getVideoItem>

// https://api.bilibili.com/x/web-interface/view?aid=336141511
export function useVideoInfo(bvid?: string) {
  const { data, error, isValidating, isLoading } = useSWR<VideoInfoResponse>(
    bvid ? '/x/web-interface/view?bvid=' + bvid : null,
  )
  return {
    data: data ? getVideoItem(data) : null,
    error,
    isValidating,
    isLoading,
  }
}
