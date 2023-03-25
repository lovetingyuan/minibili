export function getVideoInfo(aid: string | number) {
  // https://api.bilibili.com/x/web-interface/view?aid=336141511
  interface Video {
    aid: number
    bvid: string
    cid: number
    copyright: number
    ctime: number
    desc: string
    // desc_v2: [{…}]
    dimension: { width: number; height: number; rotate: number }
    duration: number
    dynamic: string
    // honor_reply: {honor: Array(1)}
    is_chargeable_season: boolean
    is_season_display: boolean
    is_story: boolean
    like_icon: string
    mission_id: number
    no_cache: boolean
    owner: { mid: number; name: string; face: string }
    pages: {
      cid: number
      dimension: { width: number; height: number; rotate: number }
      duration: number
      first_frame: string
      from: string
      page: number
      part: string
      vid: string
      weblink: string
    }[]
    pic: string
    // premiere: null
    pubdate: number
    // rights: {bp: 0, elec: 0, download: 1, movie: 0, pay: 0, …}
    season_id: number
    stat: {
      aid: number
      view: number
      danmaku: number
      favorite: number
      his_rank: number
      like: number
      now_rank: number
      reply: number
      share: number
    }
    state: number
    // subtitle: {allow_submit: true, list: Array(0)}
    teenage_mode: number
    tid: number
    title: string
    tname: string
    // ugc_season: {id: number, title: string, cover: string, mid: number, intro: string, …}
    // user_garb: {url_image_ani_cut: ''}
    videos: number
  }
  return request<Video>('/x/web-interface/view?aid=' + aid).then(res => {
    const data = res
    // if (code) {
    //   throw new Error('获取视频信息失败');
    // }
    return {
      aid: data.aid,
      bvid: data.bvid,
      cid: data.cid,
      // copyright: number;
      pubTime: data.ctime,
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
      viewNum: data.stat.view,
      cover: data.pic,
      // videosNum: data.pages.length,
      videosNum: data.pages?.length || 0,
      videos: data.videos,
      tname: data.tname,
      pages: data.pages?.map(v => {
        return {
          width: v.dimension.width,
          height: v.dimension.height,
          cid: v.cid,
          title: v.part,
          page: v.page,
        }
      }),
    }
  })
}
