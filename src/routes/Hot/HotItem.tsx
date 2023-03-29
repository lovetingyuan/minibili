import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { VideoItem } from '../../api/hot-videos'
import { parseDuration, parseNumber } from '../../utils'

export default React.memo(function HotItem({ video }: { video: VideoItem }) {
  // __DEV__ && console.log('hot video', video.title);
  const playNum = parseNumber(video.playNum)
  return (
    <View style={[styles.itemContainer]}>
      <View style={{ flex: 1 }}>
        <Image
          style={styles.image}
          source={{ uri: video.cover + '@480w_270h_1c.webp' }}
        />
        <View style={styles.videoLength}>
          <Text style={styles.videoLengthText}>
            {parseDuration(video.duration)}
          </Text>
        </View>
        {video.tag ? (
          <View style={styles.videoTag}>
            <Text style={styles.videoTagText}>{video.tag}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>
      <View style={styles.videoInfo}>
        <View style={styles.namePlay}>
          <Image
            style={styles.icon}
            source={require('../../../assets/up-mark.png')}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.upNameText]}>
            {video.name}
          </Text>
        </View>
        <View style={styles.namePlay}>
          <Image
            style={styles.icon}
            source={require('../../../assets/play-mark.png')}
          />
          <Text style={styles.playNumText}>{playNum}</Text>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    marginVertical: 12,
  },
  videoLength: {
    position: 'absolute',
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,.5)',
    alignItems: 'center',
    borderRadius: 2,
    margin: 5,
  },
  watched: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,.7)',
    alignItems: 'center',
    borderRadius: 2,
    margin: 5,
  },
  videoLengthText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#eee',
  },
  videoTag: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,.5)',
    alignItems: 'center',
    borderRadius: 2,
    margin: 5,
  },
  videoTagText: {
    color: 'white',
    fontSize: 12,
  },
  image: {
    flex: 1,
    width: undefined,
    maxWidth: '100%',
    borderRadius: 4,
    aspectRatio: 1.7,
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
  namePlay: { flexDirection: 'row', alignItems: 'center' },
})
