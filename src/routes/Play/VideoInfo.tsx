import React from 'react'
import VideoHeader from './VideoHeader'
import { View, StyleSheet } from 'react-native'
import { useVideoInfo } from '../../api/video-info'
import { ListItem, Text, Icon } from '@rneui/themed'

export default React.memo(function VideoInfo(props: {
  changePage: (p: number) => void
  bvid: string
  page: number
}) {
  const { changePage } = props
  const { data: videoInfo, isLoading } = useVideoInfo(props.bvid)
  const [expanded, setExpanded] = React.useState(false)

  const { title, desc } = videoInfo || {}
  let videoDesc = desc
  if (videoDesc === '-') {
    videoDesc = ''
  } else if (videoDesc && videoDesc === title) {
    videoDesc = ''
  }
  return (
    <>
      <VideoHeader bvid={props.bvid} />
      <View>
        <Text style={styles.videoTitle}>{title}</Text>
        {videoDesc ? <Text style={[styles.videoDesc]}>{videoDesc}</Text> : null}
        {(videoInfo?.pages?.length || 0) > 1 && props.page ? (
          <ListItem.Accordion
            icon={<Icon name={'chevron-down'} type="material-community" />}
            containerStyle={styles.pagesTitle}
            content={
              <ListItem.Content>
                <ListItem.Title>
                  视频分集（{videoInfo?.pages?.length}） {props.page}:{' '}
                  {videoInfo?.pages?.[props.page - 1].title}
                </ListItem.Title>
              </ListItem.Content>
            }
            isExpanded={expanded}
            onPress={() => {
              setExpanded(!expanded)
            }}>
            {videoInfo?.pages?.map(v => {
              const selected = v.page === props.page
              return (
                <ListItem
                  key={v.page}
                  onPress={() => {
                    changePage(v.page)
                  }}
                  containerStyle={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                  }}
                  bottomDivider>
                  <ListItem.Content>
                    <ListItem.Title
                      style={{
                        color: selected ? '#00a1d6' : '#888',
                        fontWeight: selected ? 'bold' : 'normal',
                      }}>
                      {v.page}. {v.title}
                    </ListItem.Title>
                  </ListItem.Content>
                </ListItem>
              )
            })}
          </ListItem.Accordion>
        ) : !isLoading &&
          videoInfo?.videos &&
          videoInfo?.videos !== videoInfo?.pages?.length ? (
          <Text
            style={{ marginTop: 12, color: '#FF7F24', fontStyle: 'italic' }}>
            该视频为交互视频，暂不支持
          </Text>
        ) : null}
      </View>
    </>
  )
})

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
