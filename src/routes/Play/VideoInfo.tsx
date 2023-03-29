import React from 'react'
import Divider from './Divider'
import VideoHeader from './VideoHeader'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import type { VideoInfo as VideoInfoType } from '../../api/video-info'
import { ListItem } from '@rneui/base'

export default function VideoInfo(props: {
  videoInfo: VideoInfoType | null
  currentPage: number
  changeCurrentPage: (v: number) => void
}) {
  const { videoInfo, currentPage } = props
  let videoDesc = videoInfo?.desc
  if (videoDesc === '-') {
    videoDesc = ''
  } else if (
    videoDesc &&
    videoInfo?.videosNum === 1 &&
    videoDesc === videoInfo.title
  ) {
    videoDesc = ''
  }
  const [expanded, setExpanded] = React.useState(false)
  if (!videoInfo?.bvid) {
    return (
      <View style={{ height: 50 }}>
        <ActivityIndicator color="blue" animating />
      </View>
    )
  }
  return (
    <>
      <VideoHeader videoInfo={videoInfo} />
      <View>
        <Text style={styles.videoTitle}>
          {videoInfo?.title || videoInfo?.pages[0].title || '-'}
        </Text>
        {videoDesc ? <Text style={styles.videoDesc}>{videoDesc}</Text> : null}
        {(videoInfo?.videosNum || 0) > 1 ? (
          <ListItem.Accordion
            containerStyle={{
              paddingVertical: 5,
              paddingHorizontal: 10,
              marginTop: 20,
            }}
            content={
              <ListItem.Content>
                <ListItem.Title>
                  视频分集（{videoInfo?.videosNum}） {currentPage}:{' '}
                  {videoInfo?.pages[currentPage].title}
                </ListItem.Title>
              </ListItem.Content>
            }
            isExpanded={expanded}
            onPress={() => {
              setExpanded(!expanded)
            }}>
            {videoInfo?.pages.map(v => {
              const selected = v.page === currentPage
              return (
                <ListItem
                  key={v.cid}
                  onPress={() => {
                    props.changeCurrentPage(v.page)
                  }}
                  containerStyle={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    backgroundColor: selected ? '#00AEEC' : 'white',
                  }}
                  bottomDivider>
                  <ListItem.Content>
                    <ListItem.Title
                      style={{
                        color: selected ? 'white' : '#555',
                      }}>
                      {v.page}. {v.title}
                    </ListItem.Title>
                  </ListItem.Content>
                </ListItem>
              )
            })}
          </ListItem.Accordion>
        ) : videoInfo?.videos !== videoInfo?.videosNum ? (
          <Text style={{ marginTop: 10, color: 'orange' }}>
            该视频为交互视频，暂不支持
          </Text>
        ) : null}
      </View>
      <Divider bvid={videoInfo.bvid} tag={videoInfo.tname} />
    </>
  )
}

const styles = StyleSheet.create({
  videoInfoContainer: { paddingVertical: 18, paddingHorizontal: 12 },
  videoTitle: { fontSize: 16, marginTop: 12 },
  videoDesc: { marginTop: 10 },
})
