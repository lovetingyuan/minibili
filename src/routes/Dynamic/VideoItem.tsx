import { useNavigation } from '@react-navigation/native'
// import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import RichText from '../../components/RichText'
import { NavigationProps } from '../../types'
import { SimpleVideoInfo } from '../../components/PlayInfo'
import { DynamicItem, DynamicType } from '../../api/dynamic-items'
import { isWifi } from '../../utils'

// type NavigationProps = NativeStackScreenProps<RootStackParamList>

type VideoDynamicItem = Extract<DynamicItem, { type: DynamicType.Video }>

export default function VideoItem(props: VideoDynamicItem) {
  const { mid, name, cover, title, aid, date, play, bvid, text, duration } =
    props

  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        isWifi().then(wifi => {
          navigation.navigate('Play', {
            bvid,
            commentId: aid,
            mid,
            name,
            wifi,
          })
        })
      }}>
      {text ? (
        <View style={{ marginBottom: 12 }}>
          <RichText
            text={text}
            imageSize={16}
            textProps={{ style: { fontSize: 16, lineHeight: 26 } }}
          />
        </View>
      ) : null}
      <View style={styles.videoContainer}>
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={{ uri: cover + '@702w_394h.webp' }}
            loadingIndicatorSource={require('../../../assets/video-loading.png')}
          />
          <Image
            style={styles.tvIcon}
            source={require('../../../assets/tv.png')}
          />
          <View style={styles.videoLength}>
            <Text style={styles.videoLengthText}>{duration}</Text>
          </View>
        </View>
        <View style={styles.videoInfo}>
          <Text style={styles.title} numberOfLines={3}>
            {title}
          </Text>
          <SimpleVideoInfo {...{ name, title, bvid, play, date }} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  shareIcon: { width: 15, height: 15, marginLeft: 16 },
  imageContainer: {
    flex: 5,
    marginRight: 12,
    justifyContent: 'center',
    alignContent: 'center',
  },
  tvIcon: {
    width: 40,
    height: 30,
    position: 'absolute',
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 1.8,
    borderRadius: 5,
  },
  descText: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 24,
  },
  videoContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  videoInfo: {
    flex: 6,
    justifyContent: 'space-around',
  },
  title: {
    flex: 1,
    fontSize: 15,
    marginBottom: 12,
  },
  videoInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoInfoText: {
    color: '#666',
    fontSize: 12,
  },
  videoLength: {
    position: 'absolute',
    paddingHorizontal: 2,
    backgroundColor: 'rgba(0,0,0,.5)',
    bottom: 0,
    borderRadius: 2,
    margin: 5,
  },
  videoLengthText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#e2e2e2',
  },
})
