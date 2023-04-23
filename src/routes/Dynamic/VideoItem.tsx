import { useNavigation } from '@react-navigation/native'
import React from 'react'
import {
  Image,
  // Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import RichText from '../../components/RichText'
import { NavigationProps } from '../../types'
// import { SimpleVideoInfo } from '../../components/PlayInfo'
import { DynamicItemType } from '../../api/dynamic-items'
import store from '../../store'
import { Icon } from '@rneui/themed'
import { parseNumber } from '../../utils'
import { DynamicTypeEnum } from '../../api/dynamic-items.schema'

export default function VideoItem(
  props: DynamicItemType<DynamicTypeEnum.DYNAMIC_TYPE_AV>,
) {
  const {
    mid,
    name,
    payload: { cover, title, bvid, play, duration, desc },
    date,
    text,
    face,
    commentId,
    likeCount,
  } = props

  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        store.currentVideo = {
          bvid,
          title,
          aid: +commentId,
          mid,
          name,
          face,
          desc,
          cover,
          pubDate: date,
        }
        navigation.push('Play', {
          from: 'dynamic',
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
          <View style={styles.VideoItem}>
            <View style={styles.iconText}>
              <Icon name="date-range" size={15} color="#666" />
              <Text style={styles.VideoItemText}>{props.date}</Text>
            </View>
            {play === undefined ? null : (
              <View style={styles.iconText}>
                <Icon name="play-circle-outline" size={15} color="#666" />
                <Text style={styles.VideoItemText}>{play}</Text>
              </View>
            )}
            <View style={styles.iconText}>
              <Icon name="thumb-up-off-alt" size={15} color="#666" />
              <Text style={styles.VideoItemText}>{parseNumber(likeCount)}</Text>
            </View>
          </View>
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
    color: 'white',
  },
  VideoItem: {
    flexDirection: 'row',
    flexShrink: 0,
    minWidth: 80,
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
    color: '#666',
    fontSize: 12,
  },
})
