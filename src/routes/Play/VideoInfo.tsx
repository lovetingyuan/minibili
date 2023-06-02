import React from 'react'
import VideoHeader from './VideoHeader'
import { View, StyleSheet } from 'react-native'
import { useVideoInfo } from '../../api/video-info'
import { ListItem, Text } from '@rneui/themed'
import VideoInfoContext from './videoContext'

export default function VideoInfo(props: { changePage: (p: number) => void }) {
  const { changePage } = props
  const { video, bvid, page } = React.useContext(VideoInfoContext)
  const { data: video2 } = useVideoInfo(bvid)
  const [expanded, setExpanded] = React.useState(false)
  const videoInfo = {
    ...video,
    ...video2,
  }
  const { title, desc } = videoInfo || {}
  let videoDesc = desc
  if (videoDesc === '-') {
    videoDesc = ''
  } else if (videoDesc && videoDesc === title) {
    videoDesc = ''
  }
  return (
    <>
      <VideoHeader />
      <View>
        <Text style={styles.videoTitle}>{title}</Text>
        {videoDesc ? <Text style={[styles.videoDesc]}>{videoDesc}</Text> : null}
        {(videoInfo?.videosNum || 0) > 1 && videoInfo?.pages ? (
          <ListItem.Accordion
            containerStyle={styles.pagesTitle}
            content={
              <ListItem.Content>
                <ListItem.Title>
                  视频分集（{videoInfo?.videosNum}） {page}:{' '}
                  {videoInfo?.pages[page - 1].title}
                </ListItem.Title>
              </ListItem.Content>
            }
            isExpanded={expanded}
            onPress={() => {
              setExpanded(!expanded)
            }}>
            {videoInfo?.pages.map(v => {
              const selected = v.page === page
              return (
                <ListItem
                  key={v.page}
                  onPress={() => {
                    changePage(v.page)
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
    </>
  )
}

const styles = StyleSheet.create({
  videoInfoContainer: { paddingVertical: 18, paddingHorizontal: 12 },
  videoTitle: { fontSize: 16, marginTop: 12 },
  videoDesc: { marginTop: 10 },
  pagesTitle: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 20,
  },
})
