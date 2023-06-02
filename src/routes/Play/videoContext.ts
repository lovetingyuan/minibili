import React from 'react'
import { VideoInfo } from '../../types'

const VideoInfoContext = React.createContext<{
  bvid: string
  page: number
  video?: VideoInfo
}>({ bvid: '', page: 1 })

export default VideoInfoContext
