export interface UpdateUpInfo {
  latestId: string
  currentLatestId: string
}

export interface MusicSong {
  name: string
  bvid: string
  cid: string | number
  cover: string
  duration: number
  createTime: number
  singer?: string
  year?: number
  description?: string
  rate?: number
}
