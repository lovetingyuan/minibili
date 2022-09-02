import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { Avatar } from '@rneui/themed';
import { getFansData, getUserInfo, TracyId } from '../../services/Bilibili';
import { useNavigation } from '@react-navigation/native';
import { GetFuncPromiseType, RootStackParamList } from '../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@rneui/base';
type NavigationProps = NativeStackScreenProps<RootStackParamList>;

export default function Header(props: { mid: number }) {
  const { mid } = props;
  const [fans, setFans] = React.useState('');

  const navigation = useNavigation<NavigationProps['navigation']>();
  const isTracy = mid === TracyId;
  type User = GetFuncPromiseType<typeof getUserInfo>;
  const [userInfo, setUserInfo] = React.useState<User | null>(null);
  const updateUserInfo = React.useCallback(() => {
    getUserInfo(mid).then(setUserInfo);
  }, [mid]);
  React.useEffect(() => {
    updateUserInfo();
    getFansData(mid).then(data => {
      setFans((data.follower / 10000).toFixed(1) + '万');
    });
    let timer: any;
    if (isTracy) {
      timer = setInterval(updateUserInfo, 60 * 1000);
    }
    return () => {
      timer && clearInterval(timer);
    };
  }, [mid, isTracy, updateUserInfo]);
  const nameStyle: Record<string, any> = {};
  if (isTracy) {
    nameStyle.color = '#f25d8e';
  }
  if (!userInfo) {
    return null;
  }
  return (
    <View style={styles.header}>
      <TouchableWithoutFeedback
        onPress={() => {
          navigation.navigate('WebPage', {
            url: `https://space.bilibili.com/${mid}`,
            title: userInfo.name,
          });
        }}>
        <Avatar
          size={58}
          containerStyle={{ marginRight: 14 }}
          rounded
          source={{ uri: userInfo.face + (isTracy ? '' : '@120w_120h_1c.png') }}
        />
      </TouchableWithoutFeedback>
      <View style={{ flex: 1 }}>
        <Text>
          <Text style={{ ...styles.name, ...nameStyle }}>{userInfo.name}</Text>
          {'    '} {fans}关注
        </Text>
        <Text style={styles.sign}>{userInfo.sign}</Text>
      </View>
      {userInfo.living ? (
        <Button
          title="直播中"
          type="clear"
          onPress={() => {
            if (userInfo.liveUrl) {
              navigation.navigate('WebPage', {
                url: userInfo.liveUrl,
                title: userInfo.name,
              });
            }
          }}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: StatusBar.currentHeight,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 18,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sign: {
    marginTop: 3,
    fontStyle: 'italic',
    fontSize: 13,
    letterSpacing: 1,
    color: '#666',
  },
  livingText: {
    color: '#86b300',
    marginLeft: 20,
  },
});
