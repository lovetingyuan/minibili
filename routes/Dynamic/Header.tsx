import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { Avatar } from '@rneui/themed';
import {
  getFansData,
  getLiveStatus,
  getUserInfo,
} from '../../services/Bilibili';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@rneui/base';
import { AppContext, UserInfo } from '../../context';
type NavigationProps = NativeStackScreenProps<RootStackParamList>;

export default function Header(props: {
  mid: number | string;
  name: string;
  face: string;
  sign: string;
}) {
  const { mid } = props;
  const [fans, setFans] = React.useState('');

  const navigation = useNavigation<NavigationProps['navigation']>();
  const { specialUser } = React.useContext(AppContext);
  const isTracy = mid.toString() === specialUser?.mid;
  const [userInfo, setUserInfo] = React.useState<UserInfo>({ ...props });
  const [liveInfo, setLiveInfo] = React.useState({
    living: false,
    liveUrl: '',
  });
  React.useEffect(() => {
    if (mid) {
      getUserInfo(mid)
        .then(res => {
          setUserInfo({
            name: res.name,
            face: res.face,
            sign: res.sign,
            mid: res.mid + '',
          });
          setLiveInfo({
            living: res.living,
            liveUrl: res.liveUrl || '',
          });
        })
        .catch(() => {
          if (isTracy) {
            setUserInfo({ ...userInfo, ...specialUser });
          } else {
            setUserInfo({ ...props });
          }
          getLiveStatus(mid).then(res => {
            setLiveInfo({
              living: res.living,
              liveUrl: 'https://live.bilibili.com/' + res.roomId,
            });
          });
        });
      getFansData(mid).then(data => {
        setFans((data.follower / 10000).toFixed(1) + '万');
      });
    }
  }, [mid]);
  const nameStyle: Record<string, any> = {};
  if (isTracy) {
    nameStyle.color = '#f25d8e';
  }
  const avatar = userInfo.face;
  if (!mid) {
    return <Text>{userInfo.name}</Text>;
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
          <Text style={{ ...styles.name, ...nameStyle }}>{userInfo.name}</Text>
          {'    '} {fans}关注 {isTracy ? '❤' : ''}
        </Text>
        <Text style={[styles.sign]}>{userInfo.sign}</Text>
      </View>
      {liveInfo.living ? (
        <Button
          title="直播中"
          type="clear"
          titleStyle={{ fontSize: 13 }}
          onPress={() => {
            if (liveInfo.liveUrl) {
              navigation.navigate('WebPage', {
                url: liveInfo.liveUrl,
                title: userInfo.name + '的直播间',
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
