import { type RouteProp, useRoute } from '@react-navigation/native'
import { Icon, ListItem, Text } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'

import { colors } from '@/constants/colors.tw'
import type { RootStackParamList } from '@/types'

import { useVideoInfo } from '../../api/video-info'

export default React.memo(VideoInfo)

function VideoInfo(props: {
  currentPage: number
  setCurrentPage: (p: number) => void
}) {
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { data, isLoading } = useVideoInfo(route.params.bvid)
  const [expanded, setExpanded] = React.useState(false)
  const videoInfo = {
    ...data,
    ...route.params,
  }

  const { title, desc } = videoInfo
  let videoDesc = desc
  if (videoDesc === '-') {
    videoDesc = ''
  } else if (videoDesc && videoDesc === title) {
    videoDesc = ''
  }
  return (
    <View className="  ">
      <Text className="text-base mt-3">{title}</Text>
      {videoDesc ? (
        <Text className="mt-3" selectable>
          {videoDesc}
        </Text>
      ) : null}
      {(videoInfo?.pages?.length || 0) > 1 ? (
        <ListItem.Accordion
          icon={<Icon name={'chevron-down'} type="material-community" />}
          containerStyle={tw('py-1 px-3 mt-5')}
          content={
            <ListItem.Content>
              <ListItem.Title>
                视频分集（{videoInfo?.pages?.length}） {props.currentPage}:{' '}
                {videoInfo?.pages?.[props.currentPage - 1].title}
              </ListItem.Title>
            </ListItem.Content>
          }
          isExpanded={expanded}
          onPress={() => {
            setExpanded(!expanded)
          }}>
          {videoInfo?.pages?.map(v => {
            const selected = v.page === props.currentPage
            return (
              <ListItem
                key={v.page}
                onPress={() => {
                  props.setCurrentPage(v.page)
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
  )
}
