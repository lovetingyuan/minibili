import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import { NavigationProps } from '../../types'
import { DynamicItemType } from '../../api/dynamic-items'
import store from '../../store'
import { Icon, Text, useTheme } from '@rneui/themed'
import { parseNumber } from '../../utils'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'

export default function VideoItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_AV>,
) {
  const {
    mid,
    name,
    payload: { cover, title, bvid, play, duration, desc },
    date,
    face,
    commentId,
    likeCount,
    forwardCount,
  } = props

  const navigation = useNavigation<NavigationProps['navigation']>()
  const { theme } = useTheme()
  const gray = theme.colors.grey1
  const textStyle = {
    color: gray,
    fontSize: 13,
  }

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
        navigation.navigate('Play', {
          from: {
            mid,
          },
        })
      }}>
      {props.richTexts ? (
        <RichTexts
          idStr={props.id}
          nodes={props.richTexts}
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <View style={styles.videoContainer}>
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={{ uri: cover + '@421w_236h.webp' }}
            loadingIndicatorSource={require('../../../assets/video-loading.png')}
          />
          <Image
            style={styles.tvIcon}
            source={require('../../../assets/tv.png')}
          />
          <View style={styles.videoLength}>
            <Text style={styles.videoLengthText}>{duration}</Text>
          </View>
          <View style={styles.videoDate}>
            <Text style={styles.videoLengthText}>{props.date}</Text>
          </View>
        </View>
        <View style={styles.videoInfo}>
          <Text style={[styles.title]} numberOfLines={3}>
            {title}
          </Text>
          <View style={styles.VideoItem}>
            {play === undefined ? null : (
              <View style={styles.iconText}>
                <Icon name="play-circle-outline" size={15} color={gray} />
                <Text style={textStyle}>{play}</Text>
              </View>
            )}
            <View style={styles.iconText}>
              <Icon name="thumb-up-off-alt" size={15} color={gray} />
              <Text style={textStyle}>{parseNumber(likeCount)}</Text>
            </View>
            <View style={styles.iconText}>
              <Icon
                type="material-community"
                name="share"
                size={20}
                color={gray}
              />
              <Text style={textStyle}>{parseNumber(forwardCount)}</Text>
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
    width: 50,
    height: 40,
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
    lineHeight: 22,
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
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,.7)',
    top: 0,
    right: 0,
    borderRadius: 2,
    margin: 5,
  },
  videoDate: {
    position: 'absolute',
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,.7)',
    top: 0,
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
    columnGap: 10,
    flexWrap: 'wrap',
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
})
