import useSWR from 'swr'
import { z } from 'zod'
import { VideoInfoResponseSchema } from './video-info.schema'
import request from './fetcher'

type VideoInfoResponse = z.infer<typeof VideoInfoResponseSchema>

const getVideoItem = (data: VideoInfoResponse) => {
  return {
    aid: data.aid,
    bvid: data.bvid,
    date: data.pubdate,
    desc: data.desc,
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
    danmuNum: data.stat.danmaku,
    videos: data.videos, // 如果是分片视频或者互动视频，这个videos会是大于1的数字
    tag: data.tname,
    pages: data.pages.map(v => {
      // 如果是分片视频，那么length会是分片数量，否则是1
      return {
        width: v.dimension.width,
        height: v.dimension.height,
        duration: v.duration,
        cover: v.first_frame,
        title: v.part,
        page: v.page,
      }
    }),
  }
}

export type VideoInfo = ReturnType<typeof getVideoItem>
// https://api.bilibili.com/x/web-interface/view?aid=336141511
export function useVideoInfo(bvid: string) {
  const { data, error, isLoading } = useSWR<VideoInfoResponse>(
    bvid ? '/x/web-interface/view?bvid=' + bvid : null,
    request,
  )
  return {
    data: data ? getVideoItem(data) : null,
    error,
    isLoading,
  }
}
