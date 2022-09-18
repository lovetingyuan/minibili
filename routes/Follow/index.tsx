import React from 'react';
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  Alert,
  // Image,
  Pressable,
  ToastAndroid,
  Image,
} from 'react-native';
import { Avatar } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FollowItem from './FollowItem';
import { getFollowUps, getUserInfo } from '../../services/Bilibili';
import TracyBtn from '../../components/TracyBtn';
import Login from './Login';

import { GetFuncPromiseType, RootStackParamList } from '../../types';
import { Icon, Input } from '@rneui/base';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import useMemoizedFn from '../../hooks/useMemoizedFn';
import ButtonsOverlay from '../../components/ButtonsOverlay';
import { getBlackUps } from '../Hot/blackUps';

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>;

type UserInfo = GetFuncPromiseType<typeof getUserInfo>;
type UpItem = GetFuncPromiseType<typeof getFollowUps>['list'][0];

export default function Follow({ navigation, route }: Props) {
  __DEV__ && console.log(route.name);
  const [userId, setUserId] = React.useState('');
  const [ups, setUps] = React.useState<UpItem[]>([]);
  const [loadDone, setLoadDone] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState<UserInfo>({
    living: false,
    face: '',
    liveUrl: '',
    name: '未知',
    sign: '加载失败',
    mid: 0,
    level: 0,
    sex: '',
  });
  const [followedNum, setFollowedNum] = React.useState(0);
  const inputRef = React.useRef<Input | null>(null);
  const followListRef = React.useRef<FlatList | null>(null);
  const [startUpdate, setStartUpdate] = React.useState(0);
  const getUpdate = useMemoizedFn(() => {
    ToastAndroid.show('刷新中...', ToastAndroid.SHORT);
    setStartUpdate(startUpdate + 1);
    if (!userInfo.face) {
      getUserInfo(userId).then(user => {
        setUserInfo(user);
      });
    }
  });

  const [initLoad, setInitLoad] = React.useState(true);
  // const [updatedUps, setUpdatedUps] = React.useState<number[]>([]);
  // const [hasLiving, setHasLiving] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem('USER_ID').then(id => {
      if (id) {
        setUserId(id);
      } else {
        inputRef.current?.focus();
      }
    });
  }, []);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      // Prevent default behavior
      // e.preventDefault();
      if (!navigation.isFocused()) {
        return;
      }
      followListRef.current?.scrollToIndex({
        index: 0,
        animated: true,
      });
    });
    return unsubscribe;
  }, [navigation]);
  const [modalVisible, setModalVisible] = React.useState(false);

  if (!userId) {
    return <Login setUserId={setUserId} />;
  }

  const renderItem = ({ item }: { item: UpItem }) => (
    <FollowItem item={item} startUpdate={startUpdate} />
  );
  const loadMoreUps = () => {
    if (loadDone || loading) {
      return;
    }
    setLoading(true);
    getFollowUps(userId, page)
      .then(({ list, total }) => {
        if (!followedNum) {
          setFollowedNum(total);
        }
        if (list.length) {
          setUps(ups.concat(list));
          setPage(page + 1);
        } else {
          setLoadDone(true);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  if (userId && initLoad) {
    loadMoreUps();
    setInitLoad(false);
    getUserInfo(userId).then(user => {
      setUserInfo(user);
    });
  }
  const clearUser = async () => {
    await AsyncStorage.removeItem('USER_ID');
    setUserId('');
    setUps([]);
    setLoadDone(false);
    setLoading(false);
    setPage(1);
    setInitLoad(true);
  };
  const buttons = [
    {
      text: '退出',
      name: 'logout',
    },
    {
      text: '黑名单',
      name: 'black',
    },
    {
      text: '关于',
      name: 'about',
    },
  ];
  const handleOverlayClick = (name: string) => {
    if (name === 'logout') {
      clearUser();
    } else if (name === 'black') {
      getBlackUps.then(blacks => {
        const blacksNum = Object.keys(blacks).length;
        if (!blacksNum) {
          ToastAndroid.show('暂无黑名单UP', ToastAndroid.SHORT);
        } else {
          Alert.alert(
            `黑名单(${blacksNum})`,
            Object.values(blacks)
              .filter(v => typeof v === 'string')
              .join(', '),
          );
        }
      });
    } else if (name === 'about') {
      Alert.alert(
        `关于 minibili (${require('../../app.json').expo.version})`,
        [
          '',
          '所有数据都来自B站官网，仅供学习交流',
          '',
          'https://github.com/lovetingyuan/minibili',
        ].join('\n'),
      );
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.userContainer}>
        <Avatar
          size={60}
          containerStyle={{ marginRight: 16 }}
          onPress={() => {
            if (userInfo) {
              navigation.navigate('WebPage', {
                title: userInfo.name,
                url: `https://space.bilibili.com/${userId}`,
              });
            }
          }}
          rounded
          source={
            userInfo.face
              ? { uri: userInfo.face }
              : require('../../assets/empty-avatar.png')
          }
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.myName}>{userInfo?.name || ''}</Text>
          <Text style={styles.mySign}>{userInfo?.sign || ''}</Text>
        </View>
        <Pressable
          onPress={() => {
            setModalVisible(true);
          }}>
          <Image
            source={require('../../assets/info-face.png')}
            style={styles.infoFace}
          />
        </Pressable>
        <ButtonsOverlay
          buttons={buttons}
          visible={modalVisible}
          onPress={handleOverlayClick}
          dismiss={() => {
            setModalVisible(false);
          }}
          overlayStyle={{
            minWidth: 240,
          }}
        />
      </View>
      <View style={styles.listTitleContainer}>
        <Text style={styles.listTitle}>
          关注列表
          <Text style={{ fontSize: 14 }}>({followedNum})</Text>：
        </Text>
        <Pressable onPress={getUpdate}>
          <Icon name="refresh" color="#00AEEC" />
        </Pressable>
      </View>
      <FlatList
        data={ups}
        renderItem={renderItem}
        keyExtractor={item => item.mid + ''}
        onEndReachedThreshold={1}
        onEndReached={loadMoreUps}
        ref={followListRef}
        ListEmptyComponent={
          <Text style={styles.listEmptyText}>
            {ups.length ? '关注的UP列表' : '暂无关注'}
          </Text>
        }
        ListFooterComponent={
          <Text style={styles.bottomText}>
            {ups.length ? (loadDone ? '到底了~' : '加载中...') : ''}
          </Text>
        }
      />
      <TracyBtn />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 10,
  },
  myName: { fontSize: 18, marginBottom: 5, fontWeight: 'bold' },
  mySign: { color: '#555' },
  logo: {
    width: 160,
    height: 160,
  },
  bottomText: {
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
    color: '#555',
    fontSize: 12,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  listTitleContainer: {
    // flex: 1,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 18,
    // marginLeft: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  userFace: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 20,
  },
  logoutText: { color: '#5896de', fontSize: 14 },
  listEmptyText: { textAlign: 'center', marginVertical: 40 },
  newIcon: { width: 28, height: 11, marginLeft: 8, top: 1 },
  liveIcon: {
    width: 26,
    height: 24,
  },
  infoFace: {
    width: 15,
    height: 15,
  },
});
