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
} from 'react-native';
import { Button, Avatar } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FollowItem from './FollowItem';
import { getFollowUps, getUserInfo } from '../../services/Bilibili';
import TracyBtn from '../../components/TracyBtn';
import Login from './Login';

import { GetFuncPromiseType, RootStackParamList } from '../../types';
import { Icon, Input } from '@rneui/base';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import useMemoizedFn from '../../hooks/useMemoizedFn';

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
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null);
  const [followedNum, setFollowedNum] = React.useState(0);
  const inputRef = React.useRef<Input | null>(null);
  const followListRef = React.useRef<FlatList | null>(null);
  const [startUpdate, setStartUpdate] = React.useState(0);
  const getUpdate = useMemoizedFn(() => {
    ToastAndroid.show('刷新中...', ToastAndroid.SHORT);
    setStartUpdate(startUpdate + 1);
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

  // React.useEffect(() => {
  //   if (userId) {
  //     loadMoreUps();
  //     getUserInfo(userId).then(user => {
  //       setUserInfo(user);
  //     });
  //   }
  // }, [userId]);

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
  // const handleUpdate = useMemoizedFn((mid: number) => {
  //   if (!updatedUps.includes(mid)) {
  //     setUpdatedUps(updatedUps.concat(mid));
  //   }
  // });
  // const handleLive = useMemoizedFn(() => {
  //   setHasLiving(true);
  // });
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
  return (
    <View style={styles.container}>
      <View style={styles.userContainer}>
        {userInfo?.face ? (
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
            source={{ uri: userInfo.face }}
          />
        ) : null}

        <View style={{ flex: 1 }}>
          <Text style={styles.myName}>{userInfo?.name || ''}</Text>
          <Text style={styles.mySign}>{userInfo?.sign || ''}</Text>
        </View>
        <Button
          title="退出"
          type="clear"
          onPress={() => {
            Alert.alert('确定要退出吗？', '', [
              {
                text: '取消',
                style: 'cancel',
              },
              {
                text: '确定',
                onPress: clearUser,
              },
            ]);
          }}
          titleStyle={styles.logoutText}
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
});
