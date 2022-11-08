import { ToastAndroid } from 'react-native';
// import { getBlackUps } from '../routes/Hot/blackUps';
import { DynamicType } from '../types';
import { URL } from 'react-native-url-polyfill';

let errorTime = Date.now();

// https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=326081112&timezone_offset=-480
export function request<D extends Record<string, any>>(
  url: string,
  referer?: string,
) {
  const requestUrl = url.startsWith('http')
    ? url
    : 'http://api.bilibili.com' + url;
  // return (
  // fetch(requestUrl, {
  //   headers: {
  //     host,
  //     origin: 'https://api.bilibili.com',
  //     referer: requestUrl,
  //     accept:
  //       'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  //     'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
  //     'cache-control': 'no-cache',
  //     pragma: 'no-cache',
  //     'sec-ch-ua':
  //       '"Microsoft Edge";v="105", " Not;A Brand";v="99", "Chromium";v="105"',
  //     'sec-ch-ua-mobile': '?1',
  //     'sec-ch-ua-platform': '"Android"',
  //     'sec-fetch-dest': 'document',
  //     'sec-fetch-mode': 'navigate',
  //     'sec-fetch-site': 'none',
  //     'sec-fetch-user': '?1',
  //     'upgrade-insecure-requests': '1',
  //   },
  //   referrerPolicy: 'strict-origin-when-cross-origin',
  //   body: '',
  //   method: 'GET',
  //   mode: 'cors',
  //   // credentials: 'include',
  // })
  const { origin, hostname } = new URL(requestUrl);
  return fetch(requestUrl + '&_t=' + Date.now(), {
    headers: {
      // authority: host,
      // referer: 'https://api.bilibili.com/',
      host: hostname,
      origin,
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'cache-control': 'max-age=0',
      'sec-ch-ua':
        '"Chromium";v="104", " Not A;Brand";v="99", "Microsoft Edge";v="104"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      // 'upgrade-insecure-requests': '1',
      'user-agent': 'BiLiBiLi ANDROID Client/8.0.0 (orz@****.my)',
    },
    referrer: referer || 'https://space.bilibili.com',
    referrerPolicy: 'no-referrer-when-downgrade',
    // referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    // credentials: 'omit',
    credentials: 'include',
  })
    .then(r => r.json())
    .then((res: { code: number; message: string; data: D }) => {
      if (res.code) {
        __DEV__ && console.log('error', res.code, res.message);
        if (Date.now() - errorTime > 20000) {
          ToastAndroid.show(' 数据获取失败 ', ToastAndroid.SHORT);
          errorTime = Date.now();
        }
        throw new Error('未能获取当前数据' + (__DEV__ ? ' ' + url : ''));
      }
      return res.data;
    });
  // );
}

export async function getUserInfo(uid: string | number) {
  // https://api.bilibili.com/x/space/acc/info?mid=1458143131
  interface Res {
    birthday: string;
    coins: number;
    face: string;
    level: number;
    live_room: {
      cover: string;
      liveStatus: 0 | 1;
      roomStatus: 1 | 0;
      roomid: number;
      title: string;
      url: string;
    } | null;
    mid: number;
    name: string;
    sex: string;
    sign: string;
    top_photo: string;
  }
  const data = await request<Res>(
    //?mid=1717066021&token=&platform=web&jsonp=jsonp
    '/x/space/acc/info?mid=' + uid + '&token=&platform=web&jsonp=jsonp',
    'https://space.bilibili.com/' + uid,
  );
  // if (code) {
  //   throw new Error('获取用户信息失败');
  // }
  return {
    living: !!data.live_room?.liveStatus,
    liveUrl: data.live_room?.url,
    face: data.face,
    name: data.name,
    sign: data.sign,
    mid: data.mid,
    level: data.level,
    sex: data.sex,
  };
}

export async function getDynamicItems(offset = '', uid: string | number) {
  // https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=1458143131&timezone_offset=-480
  interface Author {
    face: string;
    following: boolean;
    jump_url: string;
    label: string;
    mid: number;
    name: string;
    pub_location_text: string;
    pub_time: string;
    pub_ts: number;
    type: 'AUTHOR_TYPE_NORMAL';
  }
  interface Desc {
    text: string;
  }
  interface AV {
    desc: Desc | null;
    major: {
      type: 'MAJOR_TYPE_ARCHIVE';
      archive: {
        aid: string;
        bvid: string;
        cover: string;
        desc: string;
        duration_text: string;
        jump_url: string;
        stat: { danmaku: string; play: string };
        title: string;
        type: number;
      };
    };
  }
  interface Draw {
    desc: Desc | null;
    major: {
      type: 'MAJOR_TYPE_DRAW';
      draw: {
        id: number;
        items: {
          src: string;
          width: number;
          height: number;
          size: number;
        }[];
      };
    };
  }
  interface Article {
    desc: null;
    major: {
      type: 'MAJOR_TYPE_ARTICLE';
      article: {
        covers: string[];
        desc: string;
        label: string;
        title: string;
        items: {
          src: string;
          width: number;
          height: number;
          size: number;
        }[];
      };
    };
  }
  interface Word {
    major: null;
    desc: Desc;
    additional?: any;
  }
  interface Topic {
    major: null;
    desc: Desc;
    topic?: {
      name: string;
    };
  }
  interface Live {
    major: {
      type: 'MAJOR_TYPE_LIVE';
      live: {
        cover: string;
        title: string;
      };
    };
    desc: null;
    topic: null;
  }
  interface Res {
    has_more: boolean;
    items: (
      | {
          type: 'DYNAMIC_TYPE_AV';
          modules: {
            module_author: Author;
            module_dynamic: AV;
            module_tag?: { text: string };
          };
          id_str: string;
        }
      | {
          type: 'DYNAMIC_TYPE_FORWARD';
          id_str: string;
          modules: {
            module_author: Author;
            module_dynamic: {
              desc: Desc | null;
              major: null;
            };
            module_tag?: { text: string };
          };
          orig: {
            id_str: string;
            modules: {
              module_author: Author;
              module_dynamic: AV | Draw | Article | Word | Topic | Live;
              module_tag?: { text: string };
            };
          };
        }
      | {
          type: 'DYNAMIC_TYPE_DRAW';
          id_str: string;
          modules: {
            module_author: Author;
            module_dynamic: Draw;
            module_tag?: { text: string };
          };
        }
      | {
          type: 'DYNAMIC_TYPE_WORD';
          id_str: string;
          modules: {
            module_author: Author;
            module_dynamic: Word;
            module_tag?: { text: string };
          };
        }
    )[];
    offset: string;
    update_baseline: string;
    update_num: number;
  }
  const data = await request<Res>(
    `/x/polymer/web-dynamic/v1/feed/space?offset=${offset}&host_mid=${uid}&timezone_offset=-480`,
  );
  // if (code) {
  //   return Promise.reject(new Error(message));
  // }
  return {
    more: data.has_more,
    offset: data.offset,
    items: data.items
      .map(item => {
        const common = {
          id: item.id_str,
          date: item.modules?.module_author?.pub_time,
          time: item.modules?.module_author?.pub_ts,
          mid: item.modules?.module_author?.mid,
          name: item.modules?.module_author?.name,
          text: item.modules?.module_dynamic?.desc?.text,
          top: item.modules?.module_tag?.text === '置顶',
        };
        if (item.type === 'DYNAMIC_TYPE_WORD') {
          return {
            ...common,
            type: DynamicType.Word as const,
            additionalText:
              item.modules.module_dynamic.additional?.reserve?.desc1?.text,
          };
        }
        if (item.type === 'DYNAMIC_TYPE_AV') {
          const video = item.modules.module_dynamic.major.archive;
          return {
            ...common,
            type: DynamicType.Video as const,
            cover: video.cover,
            title: video.title,
            play: video.stat.play,
            bvid: video.bvid,
            aid: video.aid,
            duration: video.duration_text,
          };
        }
        if (item.type === 'DYNAMIC_TYPE_DRAW') {
          return {
            ...common,
            type: DynamicType.Draw as const,
            images: item.modules?.module_dynamic?.major?.draw?.items?.map(v => {
              return {
                src: v.src,
                ratio: v.width / v.height,
              };
            }),
          };
        }
        if (item.type === 'DYNAMIC_TYPE_FORWARD') {
          const forward = item.orig.modules?.module_dynamic || {};
          if (forward.major?.type === 'MAJOR_TYPE_ARCHIVE') {
            return {
              ...common,
              type: DynamicType.ForwardVideo as const,
              forwardText: forward.desc?.text,
              cover: forward.major?.archive.cover,
              title: forward.major?.archive.title,
            };
          }
          if (forward.major?.type === 'MAJOR_TYPE_DRAW') {
            return {
              ...common,
              type: DynamicType.ForwardDraw as const,
              forwardText: forward.desc?.text,
              images: forward.major.draw.items.map(v => {
                return {
                  ratio: v.width / v.height,
                  src: v.src,
                };
              }),
            };
          }
          if (forward.major?.type === 'MAJOR_TYPE_ARTICLE') {
            return {
              ...common,
              type: DynamicType.ForwardDraw as const,
              forwardText: forward.major?.article?.title,
              images: forward.major?.article?.covers?.map(v => {
                return {
                  ratio: 2,
                  src: v,
                };
              }),
            };
          }
          if (forward.major?.type === 'MAJOR_TYPE_LIVE') {
            return {
              ...common,
              type: DynamicType.ForwardVideo as const,
              forwardText: '直播',
              title: forward.major?.live.title,
              cover: forward.major?.live.cover,
              // images: forward.major?.article?.covers?.map(v => {
              //   return {
              //     ratio: 2,
              //     src: v,
              //   };
              // }),
            };
          }
          return {
            ...common,
            type: DynamicType.ForwardOther as const,
            forwardText:
              forward.desc?.text +
              ('topic' in forward && forward.topic?.name
                ? '#' + forward.topic.name
                : ''),
          };
        }
      })
      .filter(Boolean),
  };
}

export async function getFansData(uid: string | number) {
  // https://api.bilibili.com/x/relation/stat?vmid=14427395
  const data = await request<{
    mid: number;
    following: number;
    whisper: number;
    black: number;
    follower: number;
  }>(`/x/relation/stat?vmid=${uid}`);
  // if (code) {
  //   throw new Error('获取关注数失败');
  // }
  return data;
}

export async function getFollowUps(uid: number | string, page = 1) {
  // https://api.bilibili.com/x/relation/followings?vmid=14427395&pn=1&ps=20&order=desc&jsonp=jsonp
  interface Followed {
    face: string;
    mid: number | string;
    mtime: number;
    official_verify: { type: number; desc: string };
    sign: string;
    // special: 0;
    tag: null;
    uname: string;
  }
  const data = await request<{
    list: Followed[];
    total: number;
  }>(
    `/x/relation/followings?vmid=${uid}&pn=${page}&ps=20&order=desc&jsonp=jsonp`,
  );
  // if (code) {
  //   throw new Error('获取关注列表失败');
  // }
  return {
    total: data.total,
    list: data.list.map(up => {
      return {
        face: up.face,
        mid: up.mid,
        name: up.uname,
        sign: up.sign,
      };
    }),
  };
}

export async function getHotList(page = 1) {
  // https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1
  interface Hot {
    aid: number;
    bvid: string;
    cid: number;
    copyright: 1 | 0;
    ctime: number;
    desc: string;
    dimension: { width: number; height: number; rotate: number };
    duration: number;
    dynamic: string;
    first_frame: string;
    is_ogv: boolean;
    ogv_info: null;
    owner: { mid: number; name: string; face: string };
    pic: string;
    pubdate: number;
    // rcmd_reason: {content: '百万播放', corner_mark: 0}
    // rights: {bp: 0, elec: 0, download: 0, movie: 0, pay: 0, …}
    // season_type: 0
    short_link: string;
    short_link_v2: string;
    stat: {
      aid: number;
      view: number;
      danmaku: number;
      favorite: number;
      his_rank: number;
      like: number;
      now_rank: number;
      reply: number;
      share: number;
    };
    state: number;
    tid: number;
    title: string;
    tname: string;
    videos: number;
  }
  // const blackUps = await getBlackUps;
  const data = await request<{
    list: Hot[];
    no_more: boolean;
  }>(`/x/web-interface/popular?ps=20&pn=${page}`);
  // if (code !== 0) {
  //   throw new Error(message);
  // }
  const { no_more, list } = data;
  return {
    more: !no_more,
    list: list.map(item => {
      return {
        aid: item.aid,
        bvid: item.bvid,
        cid: item.cid,
        title: item.title,
        cover: item.pic,
        duration: item.duration,
        pubDate: item.pubdate,
        name: item.owner.name,
        mid: item.owner.mid,
        playNum: item.stat.view,
        shareNum: item.stat.share,
        tag: item.tname,
        videosNum: item.videos,
      };
    }),
  };
}

export function getVideoComments(aid: string | number) {
  // https://api.bilibili.com/x/v2/reply/main?csrf=dec0b143f0b4817a39b305dca99a195c&mode=3&next=4&oid=259736997&plat=1&type=1
  interface Member {
    DisplayRank: string;
    avatar: string;
    contract_desc: string;
    face_nft_new: 0;
    fans_detail: null;
    following: 0;
    is_contractor: false;
    is_followed: 0;
    is_senior_member: 0;
    level_info: {
      current_level: 3;
      current_min: 0;
      current_exp: 0;
      next_exp: 0;
    };
    mid: string;
    nameplate: {
      condition: '';
      image: '';
      image_small: '';
      level: '';
      name: '';
      nid: 0;
    };
    nft_interaction: null;
    official_verify: { type: -1; desc: '' };
    pendant: {
      expire: 0;
      image: '';
      image_enhance: '';
      image_enhance_frame: '';
      name: '';
      pid: 0;
    };
    rank: string;
    sex: string;
    sign: string;
    uname: string;
    user_sailing: { pendant: null; cardbg: null; cardbg_with_focus: null };
    // vip: {vipType: 0, vipDueDate: 0, dueRemark: '', accessStatus: 0, vipStatus: 0, …}
  }
  interface Reply {
    //     action: 0
    // assist: 0
    // attr: 0
    content: {
      message: string;
      plat: number;
      device: string;
      jump_url: {};
      max_line: number;
      members: [];
    };
    count: number;
    ctime: number;
    // dialog: 0
    // fansgrade: 0
    // folder: {has_folded: false, is_folded: false, rule: ''}
    invisible: boolean;
    like: number;
    member: Member;
    mid: number;
    oid: number;
    parent: number;
    parent_str: string;
    rcount: number;
    replies: Reply[] | null;
    reply_control: { time_desc: string; location: string };
    root: number;
    root_str: string;
    rpid: number;
    rpid_str: string;
    show_follow: boolean;
    state: number;
    type: number;
    up_action: { like: boolean; reply: boolean };
  }
  interface ReplyRes {
    assist: number;
    blacklist: number;
    callbacks: {};
    cm: {};
    config: { showtopic: 1; show_up_flag: true; read_only: false };
    // control: {input_disable: false, root_input_text: '发一条友善的评论', child_input_text: '', giveup_input_text: '不发没关系，请继续友善哦~', answer_guide_text: '需要升级成为lv2会员后才可以评论，先去答题转正吧！', …}
    // cursor: {is_begin: false, prev: 4, next: 5, is_end: false, all_count: 539, …}
    // effects: {preloading: ''}
    // folder: {has_folded: false, is_folded: false, rule: 'https://www.bilibili.com/blackboard/foldingreply.html'}
    note: 1;
    notice: null;
    replies: Reply[];
    top: {
      admin: null;
      upper: Reply | null;
      vote: null;
    };
    // top_replies: null
    // up_selection: {pending_count: 0, ignore_count: 0}
    upper: { mid: number };
    vote: 0;
  }
  return Promise.all([
    request<ReplyRes>('/x/v2/reply/main?type=1&next=1&oid=' + aid),
    request<ReplyRes>('/x/v2/reply/main?type=1&next=2&oid=' + aid),
  ]).then(([res1, res2]) => {
    // if (res.code) {
    //   throw new Error('获取评论失败');
    // }
    const replies = res1.replies
      .concat(res2.replies)
      .filter(v => !v.invisible)
      .map(item => {
        return {
          message: item.content.message,
          name: item.member.uname,
          id: item.rpid_str,
          mid: item.member.mid,
          upLike: item.up_action.like,
          top: false,
          like: item.like,
          replies:
            item.replies?.map(v => {
              return {
                message: v.content.message,
                name: v.member.uname,
                id: v.rpid_str,
                mid: v.mid,
                upLike: v.up_action.like,
                like: v.like,
              };
            }) || [],
        };
      });
    if (res1.top.upper) {
      const item = res1.top.upper;
      replies.unshift({
        message: item.content.message,
        name: item.member.uname,
        id: item.rpid_str,
        mid: item.member.mid,
        upLike: item.up_action.like,
        like: item.like,
        top: true,
        replies:
          item.replies?.map(v => {
            return {
              message: v.content.message,
              name: v.member.uname,
              id: v.rpid_str,
              mid: v.mid,
              upLike: v.up_action.like,
              like: v.like,
            };
          }) || [],
      });
    }
    return replies;
  });
}

export function getVideoInfo(aid: string | number) {
  // https://api.bilibili.com/x/web-interface/view?aid=336141511
  interface Video {
    aid: number;
    bvid: string;
    cid: number;
    copyright: number;
    ctime: number;
    desc: string;
    // desc_v2: [{…}]
    dimension: { width: number; height: number; rotate: number };
    duration: number;
    dynamic: string;
    // honor_reply: {honor: Array(1)}
    is_chargeable_season: boolean;
    is_season_display: boolean;
    is_story: boolean;
    like_icon: string;
    mission_id: number;
    no_cache: boolean;
    owner: { mid: number; name: string; face: string };
    pages: {
      cid: number;
      dimension: { width: number; height: number; rotate: number };
      duration: number;
      first_frame: string;
      from: string;
      page: number;
      part: string;
      vid: string;
      weblink: string;
    }[];
    pic: string;
    // premiere: null
    pubdate: number;
    // rights: {bp: 0, elec: 0, download: 1, movie: 0, pay: 0, …}
    season_id: number;
    stat: {
      aid: number;
      view: number;
      danmaku: number;
      favorite: number;
      his_rank: number;
      like: number;
      now_rank: number;
      reply: number;
      share: number;
    };
    state: number;
    // subtitle: {allow_submit: true, list: Array(0)}
    teenage_mode: number;
    tid: number;
    title: string;
    tname: string;
    // ugc_season: {id: number, title: string, cover: string, mid: number, intro: string, …}
    // user_garb: {url_image_ani_cut: ''}
    videos: number;
  }
  return request<Video>('/x/web-interface/view?aid=' + aid).then(res => {
    const data = res;
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
        };
      }),
    };
  });
}

export const getLiveStatus = async (mid: number | string) => {
  interface LiveUserInfo {
    room_id: number;
    info: {
      face: string;
      uid: number;
      uname: string;
    };
  }
  interface LiveInfo {
    uid: number;
    room_id: number;
    attention: number;
    online: number;
    description: string;
    live_status: number;
    title: string;
    user_cover: string;
    is_strict_room: boolean;
    live_time: string;
  }
  const {
    room_id,
    info: { uname, face },
  } = await request<LiveUserInfo>(
    'https://api.live.bilibili.com/live_user/v1/Master/info?uid=' + mid,
  );
  if (!room_id) {
    return {
      living: false,
      roomId: '',
      name: uname,
      face,
    };
  }

  const { live_status } = await request<LiveInfo>(
    'https://api.live.bilibili.com/room/v1/Room/get_info?room_id=' + room_id,
  );
  return {
    living: live_status === 1,
    roomId: room_id as number,
    name: uname,
    face,
  };
};
