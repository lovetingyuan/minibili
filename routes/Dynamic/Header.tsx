import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { Avatar } from '@rneui/themed';
import { getFansData, getUserInfo } from '../../services/Bilibili';
import { useNavigation } from '@react-navigation/native';
import { GetFuncPromiseType, RootStackParamList } from '../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@rneui/base';
// import useMemoizedFn from '../../hooks/useMemoizedFn';
// import WebviewApi from '../../components/WebviewApi';
// import useMemoizedFn from '../../hooks/useMemoizedFn';
import { AppContext } from '../../context';
type NavigationProps = NativeStackScreenProps<RootStackParamList>;

export default function Header(props: {
  mid?: number | string;
  name?: string;
  face?: string;
  sign?: string;
}) {
  const { mid, name, face, sign } = props;
  const [fans, setFans] = React.useState('');

  const navigation = useNavigation<NavigationProps['navigation']>();
  const { specialUser } = React.useContext(AppContext);
  const isTracy = mid?.toString() === specialUser?.mid;
  type User = GetFuncPromiseType<typeof getUserInfo>;
  const [userInfo, setUserInfo] = React.useState<User | null>(null);
  React.useEffect(() => {
    if (mid) {
      getUserInfo(mid).then(setUserInfo, () => setUserInfo(null));
      getFansData(mid).then(data => {
        setFans((data.follower / 10000).toFixed(1) + '万');
      });
    }
  }, [mid]);
  const nameStyle: Record<string, any> = {};
  if (isTracy) {
    nameStyle.color = '#f25d8e';
  }
  const avatar = userInfo?.face || face || '';
  if (!mid) {
    return null;
  }
  return (
    <View style={styles.header}>
      {/* <WebviewApi mid={mid} onLoad={setUserInfo} /> */}
      <TouchableWithoutFeedback
        onPress={() => {
          const title = userInfo?.name || name;
          if (title) {
            navigation.navigate('WebPage', {
              url: `https://space.bilibili.com/${mid}`,
              title,
            });
          }
        }}>
        <Avatar
          size={58}
          containerStyle={{ marginRight: 14 }}
          rounded
          source={
            avatar
              ? {
                  uri: avatar + (isTracy ? '' : '@120w_120h_1c.webp'),
                }
              : require('../../assets/empty-avatar.png')
          }
        />
      </TouchableWithoutFeedback>
      <View style={{ flex: 1 }}>
        <Text>
          <Text style={{ ...styles.name, ...nameStyle }}>
            {userInfo?.name || name || '未知'}
          </Text>
          {'    '} {fans}关注
        </Text>
        <Text style={styles.sign}>{userInfo?.sign || sign || '加载失败'}</Text>
      </View>
      {userInfo?.living ? (
        <Button
          title="直播中"
          type="clear"
          titleStyle={{ fontSize: 13 }}
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
