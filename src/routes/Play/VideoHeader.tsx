import { useNavigation } from '@react-navigation/native'
import { Avatar } from '@rneui/base'
import React from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  // ActivityIndicator,
} from 'react-native'
import { VideoInfo } from '../../api/video-info'
import { PlayInfo } from '../../components/PlayInfo'
import store from '../../store'
import { NavigationProps } from '../../types'
export default function VideoHeader(props: { videoInfo: VideoInfo }) {
  const videoInfo = props.videoInfo
  const navigation = useNavigation<NavigationProps['navigation']>()
  return (
    <View style={styles.videoHeader}>
      <Pressable
        onPress={() => {
          store.dynamicUser = {
            mid: videoInfo.mid,
            face: videoInfo.upFace || '',
            name: videoInfo.upName || '-',
            sign: '-',
          }
          navigation.navigate('Dynamic')
        }}>
        <View style={styles.upInfoContainer}>
          {videoInfo?.upFace ? (
            <Avatar
              size={35}
              rounded
              source={{ uri: videoInfo.upFace + '@80w_80h_1c.webp' }}
            />
          ) : null}
          <Text style={[styles.upName]}>{videoInfo?.upName || '-'}</Text>
        </View>
      </Pressable>
      {!!videoInfo && <PlayInfo video={videoInfo} />}
    </View>
  )
}

const styles = StyleSheet.create({
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  upInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  upName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
})
