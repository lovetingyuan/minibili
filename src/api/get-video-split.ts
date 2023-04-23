import request from './fetcher'

export default function getVideoSplit(bvid: string) {
  return request('/x/player/pagelist?bvid' + bvid)
}
