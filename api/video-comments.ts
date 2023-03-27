import fetcher from './fetcher'
import useSWR from 'swr'
interface Member {
  DisplayRank: string
  avatar: string
  contract_desc: string
  face_nft_new: 0
  fans_detail: null
  following: 0
  is_contractor: false
  is_followed: 0
  is_senior_member: 0
  level_info: {
    current_level: 3
    current_min: 0
    current_exp: 0
    next_exp: 0
  }
  mid: string
  nameplate: {
    condition: ''
    image: ''
    image_small: ''
    level: ''
    name: ''
    nid: 0
  }
  nft_interaction: null
  official_verify: { type: -1; desc: '' }
  pendant: {
    expire: 0
    image: ''
    image_enhance: ''
    image_enhance_frame: ''
    name: ''
    pid: 0
  }
  rank: string
  sex: string
  sign: string
  uname: string
  user_sailing: { pendant: null; cardbg: null; cardbg_with_focus: null }
  // vip: {vipType: 0, vipDueDate: 0, dueRemark: '', accessStatus: 0, vipStatus: 0, …}
}
interface Reply {
  //     action: 0
  // assist: 0
  // attr: 0
  content: {
    message: string
    plat: number
    device: string
    jump_url: {}
    max_line: number
    members: []
  }
  count: number
  ctime: number
  // dialog: 0
  // fansgrade: 0
  // folder: {has_folded: false, is_folded: false, rule: ''}
  invisible: boolean
  like: number
  member: Member
  mid: number
  oid: number
  parent: number
  parent_str: string
  rcount: number
  replies: Reply[] | null
  reply_control: { time_desc: string; location: string }
  root: number
  root_str: string
  rpid: number
  rpid_str: string
  show_follow: boolean
  state: number
  type: number
  up_action: { like: boolean; reply: boolean }
}
export interface ReplyResponse {
  assist: number
  blacklist: number
  callbacks: {}
  cm: {}
  config: { showtopic: 1; show_up_flag: true; read_only: false }
  // control: {input_disable: false, root_input_text: '发一条友善的评论', child_input_text: '', giveup_input_text: '不发没关系，请继续友善哦~', answer_guide_text: '需要升级成为lv2会员后才可以评论，先去答题转正吧！', …}
  // cursor: {is_begin: false, prev: 4, next: 5, is_end: false, all_count: 539, …}
  // effects: {preloading: ''}
  // folder: {has_folded: false, is_folded: false, rule: 'https://www.bilibili.com/blackboard/foldingreply.html'}
  note: 1
  notice: null
  replies: Reply[]
  top: {
    admin: null
    upper: Reply | null
    vote: null
  }
  // top_replies: null
  // up_selection: {pending_count: 0, ignore_count: 0}
  upper: { mid: number }
  vote: 0
}

const getReplies = (res1: ReplyResponse, res2: ReplyResponse) => {
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
            }
          }) || [],
      }
    })
  if (res1.top.upper) {
    const item = res1.top.upper
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
          }
        }) || [],
    })
  }
  return replies
}

export type ReplyItem = ReturnType<typeof getReplies>[0]

// https://api.bilibili.com/x/v2/reply/main?csrf=dec0b143f0b4817a39b305dca99a195c&mode=3&next=4&oid=259736997&plat=1&type=1
export function useVideoComments(aid: string | number) {
  const {
    data: res1,
    error: error1,
    // isValidating,
    isLoading,
  } = useSWR<ReplyResponse>(() => {
    return '/x/v2/reply/main?type=1&next=1&oid=' + aid
  }, fetcher)
  const {
    data: res2,
    error: error2,
    isLoading: isLoading2,
  } = useSWR<ReplyResponse>(() => {
    return '/x/v2/reply/main?type=1&next=2&oid=' + aid
  }, fetcher)
  let replies: ReplyItem[] = []
  if (
    !error1 &&
    !error2 &&
    res1 &&
    res2 &&
    Array.isArray(res1?.replies) &&
    Array.isArray(res2?.replies)
  ) {
    replies = getReplies(res1, res2)
  }
  return {
    data: replies,
    isLoading: isLoading || isLoading2,
    error: error1 || error2,
  }
}
