import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { AppContext } from '../../context';
import { getHotList } from '../../services/Bilibili';
import { GetFuncPromiseType } from '../../types';

type HotVideo = GetFuncPromiseType<typeof getHotList>['list'][0];

const parseDuration = (duration: number) => {
  if (duration >= 24 * 60 * 60) {
    return `约${Math.round(duration / 60 / 60)}小时`;
  }
  const date = new Date(duration * 1000);
  const hour = date.getHours() - date.getTimezoneOffset() / -60;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return [hour, minutes, seconds].filter(Boolean).join(':');
};

export default React.memo(function HotItem({ video }: { video: HotVideo }) {
  __DEV__ && console.log('hot video', video.title);
  const playNum = (video.playNum / 10000).toFixed(1) + '万';
  const { specialUser, playedVideos } = React.useContext(AppContext);
  const isTracy = video.mid.toString() === specialUser?.mid;
  const watched = playedVideos[video.bvid];
  return (
    <View style={[styles.itemContainer]}>
      <View style={{ flex: 1 }}>
        <Image
          style={[styles.image, watched ? { opacity: 0.6 } : null]}
          source={{ uri: video.cover + '@480w_270h_1c.webp' }}
        />
        <View style={styles.videoLength}>
          <Text style={styles.videoLengthText}>
            {parseDuration(video.duration)}
          </Text>
        </View>
        {watched ? (
          <View style={styles.watched}>
            <Text style={styles.videoLengthText}>已看过</Text>
          </View>
        ) : null}
        {watched ? (
          <Image
            source={require('../../assets/99W.png')}
            style={{
              width: '40%',
              height: '70%',
              position: 'absolute',
              top: '20%',
              alignSelf: 'center',
            }}
          />
        ) : null}
        {video.tag ? (
          <View style={styles.videoTag}>
            <Text style={styles.videoTagText}>{video.tag}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[styles.title, watched ? { opacity: 0.6 } : null]}
        numberOfLines={2}>
        {video.title}
      </Text>
      <View style={[styles.videoInfo, watched ? { opacity: 0.6 } : null]}>
        <View style={styles.namePlay}>
          <Image
            style={styles.icon}
            source={require('../../assets/up-mark.png')}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.upNameText, isTracy ? styles.upNameTracy : null]}>
            {video.name}
            {isTracy ? ' ❤' : ''}
          </Text>
        </View>
        <View style={styles.namePlay}>
          <Image
            style={styles.icon}
            source={require('../../assets/play-mark.png')}
          />
          <Text style={styles.playNumText}>{playNum}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    marginVertical: 12,
    marginHorizontal: 6,
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
  upNameTracy: { color: '#FF6699', fontWeight: 'bold', fontSize: 14 },
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
});
