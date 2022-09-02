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
          size={55}
          rounded
          source={require('../assets/tracy-avatar.webp')}
        />
      }
      size="large"
      color="#fb7299"
      placement="right"
      onPress={() => {
        navigation.navigate('Dynamic', { upId: TracyId });
      }}
    />
  );
}
