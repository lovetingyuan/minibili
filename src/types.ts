
export interface Video {
  bvid: string,
  aid: number
  title: string,
  cover: string,
  desc?: string
  view: number
  len: number
  date: number
  up: User
  cate?: string
  comments?: Reply[]
}

export interface Cate {
  id: number, name: string
}

export interface User {
  name: string
  face: string
  id: number | string,
  level?: number
  sign?: string
}

export interface Reply {
  content: string, user: string, like: number, time: number, comments?: Reply[]
}

export interface Store {
  currentVideo: Video | null,
  currentUp: User | null,
  currentCate: Cate | null,
  userInfo: User | null,
  ups: User[] | null,
  ranks: {
    [k: string]: Video[]
  },
  upVideos: {
    [k: string]: {
      list: Video[]
    }
  },
  isFullScreen: boolean,
  orientation: string
  version: string,
  latestVersion?: string
  downloadUrl?: string
  publishDate: string
}

export namespace HomePageRes {
  export interface Author {
    mid: number;
    name: string;
    face: string;
  }

  export interface Stat {
    aid: number;
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    now_rank: number;
    his_rank: number;
    like: number;
    dislike: number;
  }

  export interface Video {
    aid: number;
    type_id: number;
    tname: string;
    pic: string;
    title: string;
    pubdate: number;
    ctime: number;
    tags: any[];
    duration: number;
    author: Author;
    stat: Stat;
    hot_desc: string;
    corner_mark: number;
    bvid: string;
    owner: Author;
  }

  export interface Response {
    list: {
      // fields: ['getHot-page-count-10'],
      'getHot-page-count-10': {
        error: any,
        total: number
        extra: {
          list: Video[]
        }
      }
    }
  }
}

export namespace VideoRankRes {

  interface Rights {
    bp: number;
    elec: number;
    download: number;
    movie: number;
    pay: number;
    hd5: number;
    no_reprint: number;
    autoplay: number;
    ugc_pay: number;
    is_cooperation: number;
    ugc_pay_preview: number;
    no_background: number;
  }

  interface Owner {
    mid: number;
    name: string;
    face: string;
  }

  interface Stat {
    aid: number;
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    now_rank: number;
    his_rank: number;
    like: number;
    dislike: number;
  }

  interface Dimension {
    width: number;
    height: number;
    rotate: number;
  }

  interface Others {
    aid: number;
    videos: number;
    tid: number;
    tname: string;
    copyright: number;
    pic: string;
    title: string;
    pubdate: number;
    ctime: number;
    desc: string;
    state: number;
    attribute: number;
    duration: number;
    mission_id: number;
    rights: Rights;
    owner: Owner;
    stat: Stat;
    dynamic: string;
    cid: number;
    dimension: Dimension;
    season_id: number;
    bvid: string;
    score: number;
  }

  interface Video {
    aid: number;
    videos: number;
    tid: number;
    tname: string;
    copyright: number;
    pic: string;
    title: string;
    pubdate: number;
    ctime: number;
    desc: string;
    state: number;
    attribute: number;
    duration: number;
    mission_id: number;
    rights: Rights;
    owner: Owner;
    stat: Stat;
    dynamic: string;
    cid: number;
    dimension: Dimension;
    season_id: number;
    bvid: string;
    score: number;
    others: Others[];
  }

  export interface Response {
    code: number
    data: {
      list: Video[],
      note?: string
    }
  }

}

export namespace VideoCommentRes {
  interface Page {
    num: number;
    size: number;
    count: number;
    acount: number;
  }
  interface Up {
    mid: number
  }
  export interface Emote {
    text: string, url: string
  }
  interface Content {
    emote?: { [k: string]: Emote } // 消息中的表情
    message: string
  }
  interface Member {
    avatar: string
    mid: string
    sex: string
    sign: string
    uname: string
  }
  export interface Reply {
    content: Content
    member: Member
    like: number // 点赞数
    replies?: Reply[]
    up_action: { like: boolean, reply: boolean }
    ctime: number
    rcount: number // 回复总数
  }
  export interface Response {
    code: number
    data: {
      page: Page
      replies: Reply[]
      upper: Up
    }
  }

}

export namespace UserInfoRes {

  interface Official {
    role: number;
    title: string;
    desc: string;
    type: number;
  }

  interface Label {
    path: string;
    text: string;
    label_theme: string;
  }

  interface Vip {
    type: number;
    status: number;
    theme_type: number;
    label: Label;
    avatar_subscript: number;
    nickname_color: string;
  }

  interface Pendant {
    pid: number;
    name: string;
    image: string;
    expire: number;
    image_enhance: string;
  }

  interface Nameplate {
    nid: number;
    name: string;
    image: string;
    image_small: string;
    level: string;
    condition: string;
  }

  interface UserInfo {
    mid: number;
    name: string;
    sex: string;
    face: string;
    sign: string;
    rank: number;
    level: number;
    jointime: number;
    moral: number;
    silence: number;
    birthday: string;
    coins: number;
    fans_badge: boolean;
    official: Official;
    vip: Vip;
    pendant: Pendant;
    nameplate: Nameplate;
    is_followed: boolean;
    top_photo: string;
  }
  export interface Response {
    code: number
    data: UserInfo
  }
}

export namespace AllUpsRes {

  interface OfficialVerify {
    type: number;
    desc: string;
  }

  interface Label {
    path: string;
  }

  interface Vip {
    vipType: number;
    vipDueDate: number;
    dueRemark: string;
    accessStatus: number;
    vipStatus: number;
    vipStatusWarn: string;
    themeType: number;
    label: Label;
  }

  interface Up {
    mid: number;
    attribute: number;
    mtime: number;
    tag?: any;
    special: number;
    uname: string;
    face: string;
    sign: string;
    official_verify: OfficialVerify;
    vip: Vip;
  }
  export interface Response {
    code: number
    data: {
      list: Up[]
      total: number
    }
  }

}

export namespace UpVideosRes {

  interface Video {
    comment: number;
    typeid: number;
    play: number;
    pic: string;
    subtitle: string;
    description: string;
    copyright: string;
    title: string;
    review: number;
    author: string;
    mid: number;
    created: number;
    length: string;
    video_review: number;
    aid: number;
    bvid: string;
    hide_click: boolean;
    is_pay: number;
    is_union_video: number;
  }
  export interface Response {
    code: number
    data: {
      page: { pn: number, ps: number, total: number }
      list: {
        vlist: Video[]
      }
    }
  }
}

export namespace GithubReleaseRes {
  export interface Author {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  }

  export interface Uploader {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  }

  export interface Asset {
    url: string;
    id: number;
    node_id: string;
    name: string;
    label?: any;
    uploader: Uploader;
    content_type: string;
    state: string;
    size: number;
    download_count: number;
    created_at: Date;
    updated_at: Date;
    browser_download_url: string;
  }

  export interface Response {
    url: string;
    assets_url: string;
    upload_url: string;
    html_url: string;
    id: number;
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    draft: boolean;
    author: Author;
    prerelease: boolean;
    created_at: Date;
    published_at: Date;
    assets: Asset[];
    tarball_url: string;
    zipball_url: string;
    body: string;
  }


}

