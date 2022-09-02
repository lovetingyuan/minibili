import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {FAB, Avatar} from '@rneui/themed';
import {TracyId} from '../services/Bilibili';

const TracyImg = () => {
  return (
    <Avatar size={55} rounded source={require('../assets/tracy-avatar.webp')} />
  );
};
export default function TracyBtn() {
  const navigation = useNavigation();

  return (
    <FAB
      visible={true}
      icon={TracyImg}
      size="large"
      color="#fb7299"
      placement="right"
      onPress={() => {
        navigation.navigate('Dynamic', {upId: TracyId});
      }}
    />
  );
}
