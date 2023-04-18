import React from 'react'
import VideoHeader from './VideoHeader'
import { View, Text, StyleSheet } from 'react-native'
import { useVideoInfo } from '../../api/video-info'
import { ListItem } from '@rneui/themed'
import { useSnapshot } from 'valtio'
import store from '../../store'

export default function VideoInfo(props: {
  // bvid: string
  page: number
  // title: string
  // desc: string
  // face: string
  // name: string
  // mid: number | string
  // date: string
  isFromDynamic: boolean
  changePage: (p: number) => void
}) {
  const { page, isFromDynamic, changePage } = props
  const { currentVideo } = useSnapshot(store)
  const { data: videoInfo } = useVideoInfo(currentVideo?.bvid)
  const [expanded, setExpanded] = React.useState(false)
  const { title, desc } = currentVideo || videoInfo || {}
  let videoDesc = desc
  if (videoDesc === '-') {
    videoDesc = ''
  } else if (videoDesc && videoDesc === title) {
    videoDesc = ''
  }
  return (
    <>
      <VideoHeader isFromDynamic={isFromDynamic} />
      <View>
        <Text style={styles.videoTitle}>{title}</Text>
        {videoDesc ? <Text style={styles.videoDesc}>{videoDesc}</Text> : null}
        {(videoInfo?.videosNum || 0) > 1 ? (
          <ListItem.Accordion
            containerStyle={styles.pagesTitle}
            content={
              <ListItem.Content>
                <ListItem.Title>
                  视频分集（{videoInfo?.videosNum}） {page}:{' '}
                  {videoInfo?.pages[page].title}
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
