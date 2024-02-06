import React from 'react'
import VideoHeader from './VideoHeader'
import { View } from 'react-native'
import { useVideoInfo } from '../../api/video-info'
import { ListItem, Text, Icon } from '@rneui/themed'
import { colors } from '@/constants/colors.tw'

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
        <Text className="text-base mt-3">{title}</Text>
        {videoDesc ? <Text className="mt-3">{videoDesc}</Text> : null}
        {(videoInfo?.pages?.length || 0) > 1 && props.page ? (
          <ListItem.Accordion
            icon={<Icon name={'chevron-down'} type="material-community" />}
            containerStyle={tw('py-1 px-3 mt-5')}
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
                  containerStyle={tw('py-3 px-5')}
                  bottomDivider
                  topDivider>
                  <ListItem.Content>
                    <ListItem.Title
                      className={
                        selected
                          ? `font-bold ${colors.success.text}`
                          : 'text-gray-500'
                      }>
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
          <Text className="mt-3 italic text-orange-600">
            该视频为交互视频，暂不支持
          </Text>
        ) : null}
      </View>
    </>
  )
})
