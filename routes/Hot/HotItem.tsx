import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getHotList, TracyId } from '../../services/Bilibili';
import { GetFuncPromiseType } from '../../types';

type HotVideo = GetFuncPromiseType<typeof getHotList>['list'][0];

const parseDuration = (duration: number) => {
  const date = new Date(duration * 1000);
  // date.getTimezoneOffset()
  const hour = date.getHours() - date.getTimezoneOffset() / -60;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return [hour, minutes, seconds].filter(Boolean).join(':');
};

export default function HotItem({ video }: { video: HotVideo }) {
  const playNum = (video.playNum / 10000).toFixed(1) + '万';
  const isTracy = video.mid === TracyId;
  return (
    <View style={styles.itemContainer}>
      <Image
        style={styles.image}
        source={{ uri: video.cover + '@480w_270h_1c.webp' }}
      />
      <View style={styles.videoLength}>
        <Text style={styles.videoLengthText}>
          {parseDuration(video.duration)}
        </Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {video.title}
      </Text>
      <View style={styles.videoInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            style={styles.icon}
            source={require('../../assets/up-mark.png')}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.upNameText, isTracy ? styles.upNameTracy : null]}>
            {video.name}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            style={styles.icon}
            source={require('../../assets/play-mark.png')}
          />
          <Text style={styles.playNumText}>{playNum}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    marginVertical: 12,
    marginHorizontal: 6,
  },
  videoLength: {
    position: 'absolute',
    // paddingVertical: 1,
    paddingHorizontal: 4,
    backgroundColor: '#ddd',
    alignItems: 'center',
    borderRadius: 2,
    opacity: 0.8,
    margin: 5,
  },
  videoLengthText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
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
});
