import { useNavigation } from '@react-navigation/core';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from '@rneui/themed';
import React from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import handleShare from '../../services/Share';
import { RootStackParamList } from '../../types';

type NavigationProps = NativeStackScreenProps<RootStackParamList>;

export default function DateAndOpen(props: {
  id: number | string;
  name: string;
  date: string;
  top?: boolean;
  title: string;
}) {
  const navigation = useNavigation<NavigationProps['navigation']>();
  return (
    <View style={styles.info}>
      <Icon name="update" color="#666" size={14} />
      <Text style={styles.date}> {props.date}</Text>
      <Pressable
        onPress={() => {
          Linking.openURL(`bilibili://following/detail/${props.id}`).catch(
            err => {
              if (err.message.includes('No Activity found to handle Intent')) {
                navigation.navigate('WebPage', {
                  title: props.name + '的动态',
                  url: 'https://m.bilibili.com/dynamic/' + props.id,
                });
              }
            },
          );
        }}>
        <Image
          style={styles.biliImg}
          source={require('../../assets/bili-text.png')}
        />
      </Pressable>
      <Pressable
        onPress={() => {
          handleShare(props.name, props.title, props.id);
        }}>
        <Image
          style={styles.shareImg}
          source={require('../../assets/share.png')}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  date: { color: '#555', fontSize: 12 },
  biliImg: { width: 30, height: 12, marginLeft: 20 },
  shareImg: { width: 15, height: 15, marginLeft: 20 },
});
