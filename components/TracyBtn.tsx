import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { FAB, Avatar } from '@rneui/themed';
import { TracyId } from '../services/Bilibili';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavigationProps = NativeStackScreenProps<RootStackParamList>;

export default function TracyBtn() {
  const navigation = useNavigation<NavigationProps['navigation']>();

  return (
    <FAB
      visible={true}
      icon={
        <Avatar
          size={56}
          rounded
          source={{
            uri: 'https://i1.hdslb.com/bfs/face/2c7c282460812e14a3266f338d563b3ef4b1b009.jpg@240w_240h_1c_1s.webp',
          }}
        />
      }
      color="#fb7299"
      placement="right"
      onPress={() => {
        navigation.navigate('Dynamic', { mid: TracyId });
      }}
    />
  );
}
