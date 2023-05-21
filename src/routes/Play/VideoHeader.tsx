import { useNavigation } from '@react-navigation/native'
import { Avatar, Icon, Text } from '@rneui/themed'
import React from 'react'
import { View, Pressable, StyleSheet, ToastAndroid } from 'react-native'
import { useVideoInfo } from '../../api/video-info'
import store, { useStore } from '../../store'
import { NavigationProps } from '../../types'
import { handleShareVideo, parseDate, parseNumber } from '../../utils'
import useMounted from '../../hooks/useMounted'

export default function VideoHeader(props: { isFromDynamic: boolean }) {
  const { isFromDynamic } = props
  const { currentVideo } = useStore()
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { data: vi } = useVideoInfo(currentVideo?.bvid)
  const videoInfo = {
    ...currentVideo,
    ...vi,
  }
  const { bvid, name, face, mid, pubDate, title } = videoInfo
  const [nameTextKey, setNameTextKey] = React.useState('-')
  // const { theme } = useTheme()
  useMounted(() => {
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        setNameTextKey('--' + Math.random())
      }, (i + 1) * 100)
    }
  })
  return (
    <View style={styles.videoHeader}>
      <Pressable
        onPress={() => {
          if (isFromDynamic) {
            navigation.goBack()
            return
          }
          if (!mid || !face || !name) {
            return
          }
          store.dynamicUser = {
            mid,
            face,
            name,
            sign: '-',
          }
          navigation.navigate('Dynamic')
        }}
        style={styles.upInfoContainer}>
        <Avatar size={32} rounded source={{ uri: face + '@80w_80h_1c.webp' }} />
        <Text
          // adjustsFontSizeToFit
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.upName}
          key={nameTextKey}>
          {name + ' '}
        </Text>
      </Pressable>
      <View style={styles.VideoItem}>
        <View style={styles.iconText}>
          <Icon name="date-range" size={15} />
          <Text style={styles.VideoItemText}>{parseDate(pubDate)}</Text>
        </View>
        <View style={styles.iconText}>
          <Icon name="play-circle-outline" size={15} />
          <Text style={styles.VideoItemText}>
            {parseNumber(videoInfo?.viewNum)}
          </Text>
        </View>
        <Pressable
          style={styles.iconText}
          onPress={() => {
            ToastAndroid.show('不支持点赞', ToastAndroid.SHORT)
          }}>
          <Icon name="thumb-up-off-alt" size={15} />
          <Text style={styles.VideoItemText}>
            {parseNumber(videoInfo?.likeNum)}
          </Text>
        </Pressable>

        <Pressable
          style={styles.shareBtn}
          onPress={() => {
            if (name && title && bvid) {
              handleShareVideo(name, title, bvid)
            }
          }}>
          <Icon type="material-community" name="share" size={20} />
          <Text style={[styles.VideoItemText]}>
            {parseNumber(videoInfo?.shareNum)}
          </Text>
        </Pressable>
      </View>
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
    marginRight: 5,
    flex: 1,
  },
  upName: {
    marginLeft: 10,
    marginRight: 5,
    fontSize: 17,
    fontWeight: 'bold',
    flexGrow: 1,
    flexShrink: 1,
  },
  VideoItem: {
    flexDirection: 'row',
    flexShrink: 0,
    color: '#666',
    alignItems: 'center',
    gap: 10,
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  VideoItemText: {
    fontSize: 13,
  },
  shareBtn: { flexDirection: 'row', alignItems: 'center' },
})
