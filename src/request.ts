import { HTTP } from '@ionic-native/http';
import store from './store'
import LRU from "lru-cache"
import { Plugins } from '@capacitor/core'
import { HomePageRes, VideoRankRes, VideoCommentRes, Reply, UserInfoRes, AllUpsRes, UpVideosRes, User } from './types';
const geval = eval

export { HTTP }

const UA = `Mozilla/5.0 (Linux; Android 11.0.0; iPhone 12 Build/OPR1.170623.032; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.158 Mobile Safari/537.36`

export default function request(url: string): Promise<string> {
  const _url = new URL(url)
  // HTTP.setDataSerializer('raw')
  return HTTP.get(url, {}, {
    'User-Agent': UA,
    'Referer': url,
    'Host': _url.host
  }).then(res => {
    if (res.status === 200) {
      return res.data
    }
    throw res
  }).catch(err => {
    console.error(err)
    Plugins.Toast.show({
      text: '请求失败/(ㄒoㄒ)/~~'
    })
  })
}

const imgCache = new LRU<string, string>({
  max: 500,
  dispose(k, v) {
    URL.revokeObjectURL(v)
  }
})

export async function getImage(imgUrl: string, forcecache?: boolean): Promise<string> {
  if (imgCache.has(imgUrl)) return imgCache.get(imgUrl) as string
  if (imgUrl.startsWith('//')) {
    imgUrl = 'https:' + imgUrl
  }
  const _url = new URL(imgUrl)
  return HTTP.sendRequest(imgUrl, {
    method: 'get',
    responseType: 'blob',
    headers: {
      'User-Agent': UA,
      'Referer': imgUrl,
      'Host': _url.host
    }
  }).then((imgRes) => {
    const blobUrl = URL.createObjectURL(imgRes.data)
    if (forcecache) {
      imgCache.set(imgUrl, blobUrl, 24 * 60 * 60 * 1000)
    } else {
      imgCache.set(imgUrl, blobUrl)
    }
    return blobUrl
  })
}

export async function getHomePage() {
  if (store.ranks['-1']) return
  const page = await request('https://m.bilibili.com/?_t' + Date.now())
  if (page) {
    const domparser = new DOMParser()
    const doc = domparser.parseFromString(page, 'text/html')
    const script = [...doc.scripts].filter(script => {
      return script.textContent && script.textContent.includes('window.__INITIAL_STATE__')
    })[0];
    if (script) {
      try { geval(script.textContent || '') } catch (e) { }
      if ('__INITIAL_STATE__' in window) {
        const data: HomePageRes.Response = (window as any).__INITIAL_STATE__
        delete (window as any).__INITIAL_STATE__
        store.ranks['-1'] = data.flow[data.flow.fields[0]].extra.list.map(v => {
          return {
            bvid: v.bvid,
            aid: v.aid,
            title: v.title,
            cover: v.pic,
            desc: '',
            view: v.stat.view,
            len: v.duration * 1000,
            date: v.ctime * 1000,
            up: {
              name: v.owner.name, face: v.owner.face, id: v.owner.mid
            },
            cate: v.tname,
            comments: []
          }
        })
      }
    }
  }
}

export async function getAllUps(userId: number | string) { // 326081112
  // https://space.bilibili.com/326081112?from=search&seid=8086157821159781294
  if (store.ups.length) return
  const jsonpUrl = (pn: number) => `https://api.bilibili.com/x/relation/followings?vmid=${userId}&pn=${pn}&ps=50&order=desc&jsonp=jsonp&callback=__jp8`
  const geval = eval
  const getUp = (u: AllUpsRes.Response['data']['list'][0]) => ({
    name: u.uname,
    face: u.face,
    id: u.mid,
    sign: u.sign
  })
  return request(jsonpUrl(1)).then(res => {
    const data: AllUpsRes.Response = geval(res.replace('__jp8', ''))
    const total = data.data.total
    store.ups.push(...data.data.list.map(getUp))
    const rest = total - 50
    if (rest > 0) {
      const pages = Math.ceil(rest / 50)
      return Promise.all(Array(pages).fill(null).map((_, i) => {
        return request(jsonpUrl(i + 2))
      }))
    }
  }).then(res => {
    if (!Array.isArray(res)) return
    res.forEach(res => {
      const data = geval(res.replace('__jp8', ''))
      store.ups.push(...data.data.list.map(getUp))
    })
  })
}

export async function getUpVideos(upid: string | number) {
  if (store.upVideos[upid]) return
  // https://api.bilibili.com/x/space/arc/search?mid=326081112&ps=30&tid=0&pn=2&keyword=&order=pubdate&jsonp=jsonp
  const api = (pn: number) => `https://api.bilibili.com/x/space/arc/search?mid=${upid}&ps=100&tid=0&pn=${pn}&keyword=&order=pubdate&jsonp=jsonp`
  const up = store.currentUp as User
  return request(api(1)).then(res => {
    const data: UpVideosRes.Response = JSON.parse(res)
    if (data.code !== 0) return
    // const rest = res.data.page.count - 100
    const videoList = data.data.list.vlist.map(v => {
      const [minute, second] = v.length.split(':').map(v => parseInt(v, 10))
      return {
        bvid: v.bvid,
        aid: v.aid,
        title: v.title,
        cover: v.pic,
        desc: v.description,
        view: v.play,
        len: (minute * 60 + second) * 1000,
        date: v.created * 1000,
        up: {
          name: v.author, face: up.face, id: v.mid
        },
        cate: '',
        comments: []
      }
    })
    store.upVideos[upid] = {
      list: videoList
    }
    // if (rest > 0) {
    //   const pages = Math.ceil(rest / 100)
    //   return Promise.all(Array(pages).fill(null).map((_, i) => {
    //     return request(api(i + 2))
    //   }))
    // }
  }).then(res => {
    // if (!Array.isArray(res)) return
    // res.forEach(data => {
    //   data = JSON.parse(data)
    //   store.upVideos[upid].list.push(...data.data.list.vlist)
    // })
  })
}

export async function getRanks(cateId: number) {
  if (cateId === -1) {
    return getHomePage()
  }
  if (store.ranks[cateId]) return
  const url = `https://api.bilibili.com/x/web-interface/ranking/v2?rid=` + cateId
  return request(url).then(res => {
    const data: VideoRankRes.Response = JSON.parse(res)
    if (data.code !== 0) return
    const videoList = data.data.list.map(v => {
      return {
        bvid: v.bvid,
        aid: v.aid,
        title: v.title,
        cover: v.pic,
        desc: v.desc,
        view: v.stat.view,
        len: v.duration * 1000,
        date: v.pubdate * 1000,
        up: {
          name: v.owner.name, face: v.owner.face, id: v.owner.mid
        },
        cate: v.tname,
        comments: []
      }
    })
    store.ranks[cateId] = videoList
  })
}

export async function getUserInfo(userId: string | number) {
  // https://api.bilibili.com/x/space/acc/info?mid=674571130&jsonp=jsonp
  if (store.userInfo) return
  return request(`https://api.bilibili.com/x/space/acc/info?mid=${userId}&jsonp=jsonp`).then(res => {
    const data: UserInfoRes.Response = JSON.parse(res)
    if (data.code !== 0) return
    const userInfo = {
      name: data.data.name,
      face: data.data.face,
      id: userId,
      level: data.data.level
    }
    Plugins.Storage.set({
      key: 'userInfo', value: JSON.stringify(userInfo)
    })
    store.userInfo = userInfo
  })
}

const handleMsg = (msg: string, emoji: VideoCommentRes.Reply['content']['emote']) => {
  return msg
    .replace(/\n/g, '<br>')
    .replace(/ /g, '&nbsp;')
    .replace(/\[(.+?)\]/g, (s) => {
      if (emoji[s]) {
        return `<img width="16" data-emoji="${emoji[s].url}">`
      }
      return s
    })
}

export async function getComments(aid: string | number): Promise<Reply[] | undefined> {
  const jsonp = 'jQuery1720395761340206378_' + Date.now()
  const url = () => {
    return `https://api.bilibili.com/x/v2/reply?callback=${jsonp}&jsonp=jsonp&pn=1&type=1&oid=${aid}&sort=2&_=${Date.now()}`
  }
  const handleReply = (rep: VideoCommentRes.Reply): Reply => {
    return {
      content: handleMsg(rep.content.message, rep.content.emote),
      user: rep.member.uname,
      like: rep.like,
      time: rep.ctime * 1000,
      comments: rep.replies ? rep.replies.map(handleReply) : []
    }
  }
  return request(url()).then(res => {
    const data: VideoCommentRes.Response = geval(res.replace(jsonp, ''))
    if (data.code !== 0) return
    const replies = data.data.replies || []
    return replies.map(handleReply)
  })
}

// export async function getUpStat (uid: string | number) {
//   // https://api.bilibili.com/x/relation/stat?vmid=339233162&jsonp=jsonp
//   return request(`https://api.bilibili.com/x/relation/stat?vmid=${uid}&jsonp=jsonp`).then(res => {
//     if (res.code !== 0) return
//     const fans = res.data.follower

//   })
// }

// export function searchUpByName (name) {
//   // https://api.bilibili.com/x/web-interface/search/type?keyword=%E5%A4%B9%E6%80%A7%E8%8A%9D%E5%A3%AB&page=1&search_type=bili_user&order=totalrank&pagesize=20
//   const url = `https://api.bilibili.com/x/web-interface/search/type?keyword=${encodeURIComponent(name)}&page=1&search_type=bili_user&order=totalrank&pagesize=20`
//   return request(url).then(res => {
//     res = JSON.parse(res)
//     if (res.code !== 0) return
//     const user = res.data.result[0]
//     if (!user) return
//     const userInfo = {
//       name: user.uname,
//       id: user.mid,
//       face: user.upic,
//       fans: user.fans
//     }
//   })
// }
