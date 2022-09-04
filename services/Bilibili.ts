import { ToastAndroid } from 'react-native';
import { getBlackUps } from '../routes/Hot/blackUps';
import { DynamicType } from '../types';

export const TracyId = 1458143131; // 1660828480, 1661938567

// https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=326081112&timezone_offset=-480
export function request<D extends Record<string, any>>(url: string) {
  const host = 'api.bilibili.com';
  const requestUrl = url.startsWith('http') ? url : 'https://' + host + url;
  return fetch(requestUrl, {
    headers: {
      authority: host,
      referrer: 'https://space.bilibili.com/',
      host: host,
      origin: 'https://api.bilibili.com',
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'cache-control': 'max-age=0',
      'sec-ch-ua':
        '"Chromium";v="104", " Not A;Brand";v="99", "Microsoft Edge";v="104"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'upgrade-insecure-requests': '1',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36 Edg/104.0.1293.54',
    },
    referrerPolicy: 'no-referrer-when-downgrade',
    // referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    // credentials: 'include',
  })
    .then(r => r.json())
    .then((res: { code: number; message: string; data: D }) => {
      if (res.code) {
        ToastAndroid.show(' 数据获取失败 ', ToastAndroid.SHORT);
        throw new Error('未能获取当前数据' + (__DEV__ ? ' ' + url : ''));
      }
      return res.data;
    });
}

export async function getUserInfo(uid: string | number = TracyId) {
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
  const data = await request<Res>('/x/space/acc/info?mid=' + uid);
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

export async function getDynamicItems(offset = '', uid = TracyId) {
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
  interface Res {
    has_more: boolean;
    items: (
      | {
          type: 'DYNAMIC_TYPE_AV';
          modules: {
            module_author: Author;
            module_dynamic: AV;
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
          };
          orig: {
            id_str: string;
            modules: {
              module_author: Author;
              module_dynamic:
                | AV
                | Draw
                | {
                    major: null;
                    desc: Desc;
                  };
            };
          };
        }
      | {
          type: 'DYNAMIC_TYPE_DRAW';
          id_str: string;
          modules: {
            module_author: Author;
            module_dynamic: Draw;
          };
        }
      | {
          type: 'DYNAMIC_TYPE_WORD';
          id_str: string;
          modules: {
            module_author: Author;
            module_dynamic: {
              major: null;
              desc: Desc;
            };
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
        };
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
          return {
            ...common,
            type: DynamicType.ForwardOther as const,
            forwardText: forward.desc?.text,
            // image: forward.major?.cover,
          };
        }
      })
      .filter(Boolean),
  };
}

export async function getFansData(uid = TracyId) {
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
    // attribute: 2;
    // contract_info: {
    //   is_contractor: false;
    //   ts: 0;
    //   is_contract: false;
    //   user_attr: 0;
    // };
    face: string;
    mid: number;
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
  const blackUps = await getBlackUps;
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
    list: list
      .filter(item => {
        return !(item.owner.mid in blackUps);
      })
      .map(item => {
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
  return request<ReplyRes>('/x/v2/reply/main?type=1&oid=' + aid).then(res => {
    // if (res.code) {
    //   throw new Error('获取评论失败');
    // }
    const replies = res.replies
      .filter(v => !v.invisible)
      .map(item => {
        return {
          message: item.content.message,
          name: item.member.uname,
          id: item.rpid_str,
          mid: item.member.mid,
          upLike: item.up_action.like,
          top: false,
          replies:
            item.replies?.map(v => {
              return {
                message: v.content.message,
                name: v.member.uname,
                id: v.rpid_str,
                mid: v.mid,
                upLike: v.up_action.like,
              };
            }) || [],
        };
      });
    if (res.top.upper) {
      const item = res.top.upper;
      replies.unshift({
        message: item.content.message,
        name: item.member.uname,
        id: item.rpid_str,
        mid: item.member.mid,
        upLike: item.up_action.like,
        top: true,
        replies:
          item.replies?.map(v => {
            return {
              message: v.content.message,
              name: v.member.uname,
              id: v.rpid_str,
              mid: v.mid,
              upLike: v.up_action.like,
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
    };
  });
}
