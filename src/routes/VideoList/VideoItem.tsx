import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native'
import { VideoItem } from '../../api/hot-videos'
import { parseDate, parseDuration, parseNumber } from '../../utils'
import { useTheme } from '@rneui/themed'
// import { Image } from 'expo-image'
import commonStyles from '../../styles'
import { useStore } from '../../store'

export default React.memo(function HotItem({ video }: { video: VideoItem }) {
  // __DEV__ && console.log('hot video', video.title);
  const playNum = parseNumber(video.playNum)
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  const itemWidth = (width - 24) / 2
  const { isWiFi } = useStore()
  const ratio = isWiFi ? '@480w_300h_1c.webp' : '@320w_200h_1c.webp'
  return (
    <View style={[styles.itemContainer, { width: itemWidth }]}>
      <View style={commonStyles.flex1}>
        <Image
          width={itemWidth}
          style={[styles.image, { width: itemWidth }]}
          source={{ uri: video.cover + ratio }}
        />
        <View style={styles.textContainer}>
          <Text className="text-white text-bold text-xs">
            {parseDuration(video.duration)}
          </Text>
        </View>
        <View
          style={[
            styles.textContainer,
            {
              bottom: 0,
            },
          ]}>
          <Text style={styles.text}>{parseDate(video.pubDate)}</Text>
        </View>
        {video.tag ? (
          <View
            style={[
              styles.textContainer,
              {
                right: 0,
                bottom: 0,
              },
            ]}>
            <Text style={styles.text}>{video.tag}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[styles.title, { color: theme.colors.black }]}
        numberOfLines={2}>
        {video.title}
      </Text>
      <View style={[styles.videoInfo]}>
        <View style={[styles.upName]}>
          <Image
            style={styles.icon}
            source={require('../../../assets/up-mark.png')}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.upNameText,
              {
                color: theme.colors.primary,
              },
            ]}>
            {video.name}
          </Text>
        </View>
        <View style={[styles.playNum]}>
          <Image
            style={styles.icon}
            source={require('../../../assets/play-mark.png')}
          />
          <Text style={[styles.playNumText, { color: theme.colors.grey1 }]}>
            {playNum}
          </Text>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  itemContainer: {
    // flex: 1,
    marginVertical: 12,
    alignSelf: 'center',
  },
  textContainer: {
    position: 'absolute',
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,.7)',
    alignItems: 'center',
    borderRadius: 2,
    margin: 5,
  },
  videoTag: {
    right: 0,
    bottom: 0,
  },
  text: {
    color: 'white',
    fontSize: 12,
  },
  image: {
    flex: 1,
    borderRadius: 5,
    aspectRatio: 1.6,
  },
  title: {
    fontSize: 15,
    marginTop: 8,
    minHeight: 35,
    color: '#333',
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  upNameText: {
    color: '#00699D',
    marginLeft: 4,
    fontSize: 13,
    flexGrow: 1,
    flexShrink: 1,
  },
  playNumText: {
    color: '#555',
    marginLeft: 4,
    fontSize: 13,
  },
  icon: {
    width: 13,
    height: 11,
  },
  upName: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  playNum: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
})
