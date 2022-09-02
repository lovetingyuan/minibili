import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from '@rneui/base';
import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getDynamicItems, TracyId } from '../../services/Bilibili';
import handleShare from '../../services/Share';
import {
  DynamicType,
  GetFuncPromiseType,
  RootStackParamList,
} from '../../types';

type NavigationProps = NativeStackScreenProps<RootStackParamList>;

type DynamicItems = GetFuncPromiseType<typeof getDynamicItems>['items'][0];

type VideoDynamicItem = Extract<DynamicItems, { type: DynamicType.Video }>;

export default function VideoItem(props: VideoDynamicItem) {
  const { mid, name, cover, title, aid, date, play, bvid, text } = props;
  const isTracy = mid === TracyId;
  const onShare = useCallback(() => {
    handleShare(name, title, bvid);
  }, [name, title, bvid]);
  const navigation = useNavigation<NavigationProps['navigation']>();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('Play', {
          bvid,
          aid,
          mid,
          name,
        });
      }}>
      {text ? <Text style={styles.descText}>{text}</Text> : null}
      <View style={styles.videoContainer}>
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={{ uri: cover + (isTracy ? '' : '@702w_394h.webp') }}
            loadingIndicatorSource={require('../../assets/video-loading.png')}
          />
          <Image
            style={styles.tvIcon}
            source={require('../../assets/tv.png')}
          />
        </View>
        <View style={styles.videoInfo}>
          <Text style={styles.title} numberOfLines={3}>
            {title}
          </Text>
          <View>
            <View style={styles.videoInfoItem}>
              <Icon name="update" color="#666" size={14} />
              <Text style={styles.videoInfoText}> {date}</Text>
              <Text>{'  '}</Text>
              <Icon name="play-arrow" color="#666" size={18} />
              <Text style={styles.videoInfoText}>{play}</Text>
              <Pressable onPress={onShare}>
                <Image
                  style={styles.shareIcon}
                  source={require('../../assets/share.png')}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
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
});
