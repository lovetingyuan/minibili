export interface UpdateUpInfo {
  latestId: string
  currentLatestId: string
}

export interface MusicSong {
  name: string
  bvid: string
  cid: number
  cover: string
  duration: number
  createTime: number
  singer?: string
  year?: number | string
  description?: string
  rate?: number
}
