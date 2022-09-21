import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { FAB, Avatar } from '@rneui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AppContext } from '../context';

type NavigationProps = NativeStackScreenProps<RootStackParamList>;

export default function TracyBtn() {
  const navigation = useNavigation<NavigationProps['navigation']>();
  const { specialUser } = React.useContext(AppContext);
  if (!specialUser) {
    return null;
  }
  return (
    <FAB
      visible={true}
      icon={
        <Avatar
          size={56}
          rounded
          source={{
            uri: specialUser.face,
          }}
        />
      }
      color="#fb7299"
      placement="right"
      onPress={() => {
        navigation.navigate('Dynamic', { mid: specialUser.mid, follow: true });
      }}
    />
  );
}
